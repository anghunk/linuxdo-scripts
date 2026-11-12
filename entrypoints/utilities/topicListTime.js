const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export function renderViewsTime(views, html, color) {
	if (!views) return null;

	let timeNode = null;
	for (const child of views.children) {
		if (child.classList?.contains('linuxtime')) {
			timeNode = child;
			break;
		}
	}

	if (!timeNode) {
		timeNode = views.ownerDocument.createElement('span');
		timeNode.className = 'linuxtime';
		views.appendChild(timeNode);
	}

	for (const child of views.childNodes) {
		if (child === timeNode) continue;
		if (child.nodeType === TEXT_NODE) {
			if (child.nodeValue.trim()) {
				child.nodeValue = '';
			}
		} else if (child.nodeType === ELEMENT_NODE) {
			child.style.display = 'none';
		}
	}

	timeNode.style.color = color;
	timeNode.innerHTML = html;
	return timeNode;
}
