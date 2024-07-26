// Resize the editor on resizer drag.
resizerEl.addEventListener('mousedown', e =>
{
	if (isResizing)
	{
		return;
	}

	isResizing = true;
	document.documentElement.style.userSelect = 'none';
});

addEventListener('mouseup', e =>
{
	if (!isResizing)
	{
		return;
	}

	isResizing = false;
	document.documentElement.style.userSelect = 'auto';
});

addEventListener('mousemove', e =>
{
	if (!isResizing)
	{
		return;
	}

	const topOffset = e.clientY;
	document.documentElement.style.setProperty('--edited-demo-height', topOffset + 'px');
	editor.layout();
});