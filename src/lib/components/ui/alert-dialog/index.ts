import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';

import Content from './alert-dialog-content.svelte';
import Action from './alert-dialog-action.svelte';
import Cancel from './alert-dialog-cancel.svelte';
import Title from '../dialog/dialog-title.svelte';
import Description from '../dialog/dialog-description.svelte';
import Header from '../dialog/dialog-header.svelte';
import Footer from '../dialog/dialog-footer.svelte';

const Root = AlertDialogPrimitive.Root;
const Trigger = AlertDialogPrimitive.Trigger;
const Portal = AlertDialogPrimitive.Portal;

export {
	Root,
	Trigger,
	Portal,
	Content,
	Action,
	Cancel,
	Title,
	Description,
	Header,
	Footer,
	//
	Root as AlertDialog,
	Trigger as AlertDialogTrigger,
	Portal as AlertDialogPortal,
	Content as AlertDialogContent,
	Action as AlertDialogAction,
	Cancel as AlertDialogCancel,
	Title as AlertDialogTitle,
	Description as AlertDialogDescription,
	Header as AlertDialogHeader,
	Footer as AlertDialogFooter
};
