/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

// Minimal service worker: no offline caching yet, just enough to make the
// app installable as a PWA. install/activate are the two events required
// for the browser to consider the app "installable".

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', () => {
	// Activate the new service worker as soon as it finishes installing.
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// Take control of any open clients immediately.
	event.waitUntil(self.clients.claim());
});
