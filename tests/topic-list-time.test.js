import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderViewsTime } from '../entrypoints/utilities/topicListTime.js';

class FakeNode {
	constructor(nodeType, ownerDocument) {
		this.nodeType = nodeType;
		this.ownerDocument = ownerDocument;
		this.parentNode = null;
	}
}

class FakeText extends FakeNode {
	constructor(value, ownerDocument) {
		super(3, ownerDocument);
		this.nodeValue = value;
	}
}

class FakeElement extends FakeNode {
	constructor(tagName, ownerDocument) {
		super(1, ownerDocument);
		this.tagName = tagName.toUpperCase();
		this.childNodes = [];
		this.style = {};
		this._className = '';
	}

	get className() {
		return this._className;
	}

	set className(value) {
		this._className = value;
	}

	get classList() {
		const element = this;
		return {
			contains(name) {
				return element._className.split(/\s+/).includes(name);
			},
		};
	}

	get children() {
		return this.childNodes.filter((node) => node.nodeType === 1);
	}

	appendChild(node) {
		if (node.parentNode) node.parentNode.removeChild(node);
		this.childNodes.push(node);
		node.parentNode = this;
		return node;
	}

	removeChild(node) {
		const index = this.childNodes.indexOf(node);
		if (index === -1) {
			const error = new Error('The node to be removed is not a child of this node.');
			error.name = 'NotFoundError';
			throw error;
		}
		this.childNodes.splice(index, 1);
		node.parentNode = null;
		return node;
	}

	set innerHTML(value) {
		for (const child of this.childNodes) child.parentNode = null;
		this.childNodes = [];
		if (value !== '') this.appendChild(new FakeText(String(value), this.ownerDocument));
	}
}

class FakeDocument {
	createElement(tagName) {
		return new FakeElement(tagName, this);
	}

	createTextNode(value) {
		return new FakeText(value, this);
	}
}

function createViewsCell() {
	const document = new FakeDocument();
	const views = document.createElement('td');
	views.className = 'views';
	const number = document.createElement('span');
	number.className = 'number';
	const numberText = document.createTextNode('1234');
	number.appendChild(numberText);
	views.appendChild(number);
	return { views, number, numberText };
}

test('替换浏览量时保留框架持有的节点，回收 removeChild 不抛错', () => {
	const { views, number, numberText } = createViewsCell();

	const time = renderViewsTime(views, '（08/29 12:59）', '#45B5AA');

	assert.equal(number.parentNode, views);
	assert.equal(numberText.parentNode, number);
	assert.equal(number.style.display, 'none');
	assert.equal(time.parentNode, views);
	assert.equal(time.className, 'linuxtime');
	assert.equal(time.style.color, '#45B5AA');
	assert.equal(time.childNodes[0].nodeValue, '（08/29 12:59）');
	assert.doesNotThrow(() => views.removeChild(number));
});

test('重复更新时间复用同一个节点', () => {
	const { views } = createViewsCell();

	const first = renderViewsTime(views, '（08/29 12:59）', '#45B5AA');
	const second = renderViewsTime(views, '（09/01 10:00）', '#66A586');

	assert.equal(first, second);
	assert.equal(views.children.filter((child) => child.classList.contains('linuxtime')).length, 1);
	assert.equal(second.childNodes[0].nodeValue, '（09/01 10:00）');
	assert.equal(second.style.color, '#66A586');
});

test('纯文本浏览量单元格保留原文本节点', () => {
	const document = new FakeDocument();
	const views = document.createElement('td');
	const text = document.createTextNode('1234');
	views.appendChild(text);

	renderViewsTime(views, '（08/29 12:59）', '#45B5AA');

	assert.equal(text.parentNode, views);
	assert.equal(text.nodeValue, '');
	assert.equal(views.children.length, 1);
});
