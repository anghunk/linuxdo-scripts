<template>
  <div class="item">
    <div class="tit">{{ sort }}. 是否显示 Obsidian Callouts</div>
    <input
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
  </div>
</template>

<script>
const emojiSet = [
  {
    id: 1,
    html: `<blockquote data-callout-type="note" class="callout" dir="auto" style="background-color: rgba(8, 109, 221, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-far-pen-to-square svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#far-pen-to-square"></use></svg></span><span class="callout-title-inner">Note</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!note]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 2,
    html: `<blockquote data-callout-type="abstract" class="callout" dir="auto" style="background-color: rgba(0, 191, 188, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-far-clipboard svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#far-clipboard"></use></svg></span><span class="callout-title-inner">Abstract</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!abstract]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 3,
    html: `<blockquote data-callout-type="info" class="callout" dir="auto" style="background-color: rgba(2, 122, 255, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-far-lightbulb svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#far-lightbulb"></use></svg></span><span class="callout-title-inner">Info</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!info]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 4,
    html: `<blockquote data-callout-type="todo" class="callout" dir="auto" style="background-color: rgba(2, 122, 255, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-far-circle-check svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#far-circle-check"></use></svg></span><span class="callout-title-inner">Todo</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!todo]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 5,
    html: `<blockquote data-callout-type="tip" class="callout" dir="auto" style="background-color: rgba(0, 191, 188, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-fire-flame-curved svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#fire-flame-curved"></use></svg></span><span class="callout-title-inner">Tip</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!tip]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 6,
    html: `<blockquote data-callout-type="success" class="callout" dir="auto" style="background-color: rgba(68, 207, 110, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-check svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#check"></use></svg></span><span class="callout-title-inner">Success</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!success]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 7,
    html: `<blockquote data-callout-type="question" class="callout" dir="auto" style="background-color: rgba(236, 117, 0, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-far-circle-question svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#far-circle-question"></use></svg></span><span class="callout-title-inner">Question</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!question]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 8,
    html: `<blockquote data-callout-type="warning" class="callout" dir="auto" style="background-color: rgba(236, 117, 0, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-triangle-exclamation svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#triangle-exclamation"></use></svg></span><span class="callout-title-inner">Warning</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!warning]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 9,
    html: `<blockquote data-callout-type="failure" class="callout" dir="auto" style="background-color: rgba(233, 49, 71, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-xmark svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#xmark"></use></svg></span><span class="callout-title-inner">Failure</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!failure]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 10,
    html: `<blockquote data-callout-type="danger" class="callout" dir="auto" style="background-color: rgba(233, 49, 71, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-bolt svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#bolt"></use></svg></span><span class="callout-title-inner">Danger</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!danger]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 11,
    html: `<blockquote data-callout-type="bug" class="callout" dir="auto" style="background-color: rgba(233, 49, 71, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-bug svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#bug"></use></svg></span><span class="callout-title-inner">Bug</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!bug]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 12,
    html: `<blockquote data-callout-type="example" class="callout" dir="auto" style="background-color: rgba(120, 82, 238, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-list svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#list"></use></svg></span><span class="callout-title-inner">Example</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!example]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 13,
    html: `<blockquote data-callout-type="quote" class="callout" dir="auto" style="background-color: rgba(158, 158, 158, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-quote-left svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#quote-left"></use></svg></span><span class="callout-title-inner">Quote</span></div>
<div class="callout-content"><p>
Lorem ipsum dolor sit amet</p></div></blockquote>`,
    value: `> [!quote]
> Lorem ipsum dolor sit amet

`,
  },
  {
    id: 14,
    html: `<blockquote data-callout-type="warning" class="callout is-collapsible" dir="auto" style="background-color: rgba(236, 117, 0, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-triangle-exclamation svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#triangle-exclamation"></use></svg></span><span class="callout-title-inner">别看了</span><span class="callout-fold"><svg class="fa d-icon d-icon-chevron-down svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#chevron-down"></use></svg></span></div>
<div class="callout-content"><p>
快折起来。</p></div></blockquote>`,
    value: `> [!warning]+ 别看了
> 快折起来。

`,
  },
  {
    id: 15,
    html: `<blockquote data-callout-type="success" class="callout is-collapsible is-collapsed" dir="auto" style="background-color: rgba(68, 207, 110, 0.1);"><div class="callout-title"><span class="callout-icon"><svg class="fa d-icon d-icon-check svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#check"></use></svg></span><span class="callout-title-inner">非常成功</span><span class="callout-fold is-collapsed"><svg class="fa d-icon d-icon-chevron-down svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#chevron-down"></use></svg></span></div>
<div class="callout-content" style="display: none;"><p>
确实如此。</p></div></blockquote>`,
    value: `> [!success]- 非常成功
> 确实如此。

`,
  },
];

export default {
  data() {
    return {
      emojiTimer: null,
    };
  },
  props: ["modelValue", "sort"],
  emits: ["update:modelValue"],
  created() {
    if (this.modelValue) {
      this.setupEmojiButton();
    }
  },
  methods: {
    setupEmojiButton() {
      this.emojiTimer = setInterval(() => {
        var editor = document.querySelector(".d-editor-button-bar");
        if (!document.querySelector(".obsidian-callouts-button") && editor) {
          var ObsidianCalloutsBtn = document.createElement("button");
          ObsidianCalloutsBtn.classList.add(
            "btn",
            "no-text",
            "btn-icon",
            "emoji",
            "obsidian-callouts-button"
          );
          ObsidianCalloutsBtn.title = "插入 Obsidian Callouts";
          ObsidianCalloutsBtn.innerHTML = `<svg class="fa d-icon d-icon-far-lightbulb svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#far-lightbulb"></use></svg>`;
          editor.appendChild(ObsidianCalloutsBtn);
          ObsidianCalloutsBtn.addEventListener("click", function () {
            var ObsidianCalloutsPicke = document.createElement("div");
            ObsidianCalloutsPicke.className = "ObsidianCalloutsPicke";
            var emojiSetHtml = emojiSet
              .map((emo) => `<div title="${emo.value}">${emo.html}</div>`)
              .join("");
            ObsidianCalloutsPicke.innerHTML = emojiSetHtml;
            ObsidianCalloutsPicke.style.position = "absolute";
            ObsidianCalloutsPicke.style.background = "#FFF";
            ObsidianCalloutsPicke.style.border = "1px solid #ddd";
            ObsidianCalloutsPicke.style.padding = "10px";
            ObsidianCalloutsPicke.style.height = document.querySelector('.d-editor-textarea-column').getBoundingClientRect().height + 'px';
            if (
              document.body.contains(document.querySelector(".ObsidianCalloutsPicke"))
            ) {
              document.querySelector(".ObsidianCalloutsPicke").remove();
            } else {
              ObsidianCalloutsBtn.after(ObsidianCalloutsPicke);
            }
            ObsidianCalloutsPicke.addEventListener("click", function (e) {
              var textAreaObsidianCallouts = document.querySelector(".d-editor-input");
              if (!textAreaObsidianCallouts) {
                alert("找不到输入框");
                return;
              }

              var clickedItem = e.target.closest("[title]"); // 查找有 title 属性的最近父级

              var emojiMarkdownObsidianCallouts = `${
                e.target.title || clickedItem?.title || ""
              }`;

              // 在光标位置插入 Obsidian Callouts
              var startPosOb = textAreaObsidianCallouts.selectionStart;
              var endPosOb = textAreaObsidianCallouts.selectionEnd;
              textAreaObsidianCallouts.value =
                textAreaObsidianCallouts.value.substring(0, startPosOb) +
                emojiMarkdownObsidianCallouts +
                textAreaObsidianCallouts.value.substring(
                  endPosOb,
                  textAreaObsidianCallouts.value.length
                );
              // 触发输入事件
              var event = new Event("input", {
                bubbles: true,
                cancelable: true,
              });
              textAreaObsidianCallouts.dispatchEvent(event);
              // 隐藏选择器
              ObsidianCalloutsPicke.remove();
            });
          });
        }
      }, 100);
    },
  },
  beforeUnmount() {
    if (this.emojiTimer) {
      clearInterval(this.emojiTimer);
      this.emojiTimer = null;
    }
  },
  beforeDestroy() {
    if (this.emojiTimer) {
      clearInterval(this.emojiTimer);
      this.emojiTimer = null;
    }
  },
};

// 为了保持原有功能，保留全局的表情插入函数
window.insertEmojiObsidian = function (event) {
  var textAreaObsidianCallouts = document.querySelector(".d-editor-input");
  if (!textAreaObsidianCallouts) {
    alert("找不到输入框");
    return;
  }
  var emojiMarkdownObsidianCallouts = `:${event.target.getAttribute("name")}: `;

  // 在光标位置插入表情包
  var startPosObsidian = textAreaObsidianCallouts.selectionStart;
  var endPosObsidian = textAreaObsidianCallouts.selectionEnd;
  textAreaObsidianCallouts.value =
    textAreaObsidianCallouts.value.substring(0, startPosObsidian) +
    emojiMarkdownObsidianCallouts +
    textAreaObsidianCallouts.value.substring(
      endPosObsidian,
      textAreaObsidianCallouts.value.length
    );

  // 触发输入事件
  var inputEventObsidian = new Event("input", {
    bubbles: true,
    cancelable: true,
  });
  textAreaObsidianCallouts.dispatchEvent(inputEventObsidian);

  // 隐藏选择器
  if (document.querySelector(".ObsidianCalloutsPicke")) {
    document.querySelector(".ObsidianCalloutsPicke").remove();
  }
};
</script>
