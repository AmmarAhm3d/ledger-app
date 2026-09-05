export interface DragToDismissOptions {
	getSheet: () => HTMLElement | null | undefined;
	onDismiss: () => void;
	/** fraction of the sheet's height that counts as "dragged far enough to dismiss" */
	dismissThreshold?: number;
	/** px/ms release velocity that counts as a flick-to-dismiss regardless of distance */
	velocityThreshold?: number;
}

const SNAP_TRANSITION = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';

/** how far back (ms) the rolling velocity window looks, to smooth out single-frame jitter */
const VELOCITY_WINDOW_MS = 60;

export function dragToDismiss(node: HTMLElement, options: DragToDismissOptions) {
	let opts = options;
	let startY = 0;
	let dragY = 0;
	let dragging = false;
	let sheet: HTMLElement | null = null;
	let activePointerId: number | null = null;
	let samples: { y: number; t: number }[] = [];

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		if (dragging) return;
		sheet = opts.getSheet() ?? null;
		if (!sheet) return;
		dragging = true;
		activePointerId = e.pointerId;
		startY = e.clientY;
		dragY = 0;
		samples = [{ y: e.clientY, t: performance.now() }];
		sheet.style.transition = 'none';
		node.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging || !sheet || e.pointerId !== activePointerId) return;
		const now = performance.now();
		samples.push({ y: e.clientY, t: now });
		while (samples.length > 1 && now - samples[0].t > VELOCITY_WINDOW_MS) samples.shift();

		const height = sheet.getBoundingClientRect().height || 1;
		dragY = Math.min(height, Math.max(0, e.clientY - startY));
		sheet.style.transform = `translateY(${dragY}px)`;
	}

	function getVelocity() {
		if (samples.length < 2) return 0;
		const first = samples[0];
		const last = samples[samples.length - 1];
		const dt = Math.max(1, last.t - first.t);
		return (last.y - first.y) / dt;
	}

	function endDrag(e: PointerEvent) {
		if (!dragging || !sheet || e.pointerId !== activePointerId) return;
		dragging = false;
		activePointerId = null;
		const velocity = getVelocity();
		const activeSheet = sheet;
		const height = activeSheet.getBoundingClientRect().height || 1;
		const pastDistance = dragY > height * (opts.dismissThreshold ?? 0.25);
		const pastVelocity = velocity > (opts.velocityThreshold ?? 0.5);
		const shouldDismiss = dragY > 0 && (pastDistance || pastVelocity);

		if (shouldDismiss) {
			let finished = false;
			const finish = () => {
				if (finished) return;
				finished = true;
				activeSheet.removeEventListener('transitionend', finish);
				// Suppress the library's own close animation so it doesn't snap
				// back to translateY(0) before playing its exit keyframe.
				activeSheet.style.animation = 'none';
				opts.onDismiss();
			};
			activeSheet.style.transition = SNAP_TRANSITION;
			activeSheet.style.transform = 'translateY(100%)';
			activeSheet.addEventListener('transitionend', finish, { once: true });
			setTimeout(finish, 220);
		} else {
			activeSheet.style.transition = SNAP_TRANSITION;
			activeSheet.style.transform = '';
		}
		dragY = 0;
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointermove', onPointerMove);
	node.addEventListener('pointerup', endDrag);
	node.addEventListener('pointercancel', endDrag);

	return {
		update(newOptions: DragToDismissOptions) {
			opts = newOptions;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', endDrag);
			node.removeEventListener('pointercancel', endDrag);
		}
	};
}
