import { Select as SelectPrimitive } from 'bits-ui';

import Trigger from './select-trigger.svelte';
import Content from './select-content.svelte';
import Item from './select-item.svelte';
import Value from './select-value.svelte';

const Root = SelectPrimitive.Root;
const Group = SelectPrimitive.Group;
const GroupHeading = SelectPrimitive.GroupHeading;

export {
	Root,
	Trigger,
	Content,
	Item,
	Value,
	Group,
	GroupHeading,
	//
	Root as Select,
	Trigger as SelectTrigger,
	Content as SelectContent,
	Item as SelectItem,
	Value as SelectValue,
	Group as SelectGroup,
	GroupHeading as SelectGroupHeading
};
