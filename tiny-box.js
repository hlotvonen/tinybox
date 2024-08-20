class TinyBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          width: 100%;
          height: 100%;
          container-type: inline-size;
        }
        #container {
          display: flex;
          width: 100%;
          height: 100%;
        }
        #editor {
          display: flex;
          flex-direction: column;
          width: 50%;
          height: 100%;
          background: #1d1d1d;
          resize: horizontal;
          overflow: auto;
        }
        #output {
          display: flex;
          background: white;
          flex-grow: 1;
          overflow: auto;
        }
        .input-container {
          display: flex;
          height: calc(100% / 3);
          position: relative;
          padding: 8px;
          resize: vertical;
          overflow: auto;
        }
        textarea {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: 4px;
          background-color: black;
          border-radius: 4px;
          color: #f1f1f1;
          font-family: 'FontWithASyntaxHighlighter', monospace;
          line-height: 1.4;
          resize: none;
          overflow: auto;
          white-space: pre;
        }
        iframe {
          border: none;
          flex: 1;
        }
        @container (max-width: 900px) {
          #container {
            flex-direction: column;
          }
          #editor {
            width: 100%;
            height: 50%;
            resize: vertical;
          }
        }
      </style>
      <div id="container">
        <div id="editor">
          <div class="input-container">
            <textarea id="htmlInput" placeholder="Enter HTML here..."></textarea>
          </div>
          <div class="input-container">
            <textarea id="cssInput" placeholder="Enter CSS here..."></textarea>
          </div>
          <div class="input-container">
            <textarea id="jsInput" placeholder="Enter JavaScript here..."></textarea>
          </div>
        </div>
        <div id="output">
          <iframe id="outputFrame"></iframe>
        </div>
      </div>
    `;

    this.htmlInput = this.shadowRoot.getElementById("htmlInput");
    this.cssInput = this.shadowRoot.getElementById("cssInput");
    this.jsInput = this.shadowRoot.getElementById("jsInput");

    this.outputFrame = this.shadowRoot.getElementById("outputFrame");
    this.container = this.shadowRoot.getElementById('container');
    this.editor = this.shadowRoot.getElementById('editor');

    this.clearInlineStyles = this.clearInlineStyles.bind(this);
    this.updateOutput = this.updateOutput.bind(this);
    this.handleTab = this.handleTab.bind(this);

    this.addEditorFont();
  }

  addEditorFont() {
    if (document.querySelector('style[data-description="tinybox-font-face"]')) {
      return;
    }
    const EDITOR_FONT = `@font-face {
      font-family: 'FontWithASyntaxHighlighter';
      src: url('./FontWithASyntaxHighlighter-Regular.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }`;
    const style = document.createElement("style");
    style.dataset.description = "tinybox-font-face";
    style.textContent = EDITOR_FONT;
    document.head.appendChild(style);
  }

  connectedCallback() {
    this.htmlInput.addEventListener("input", this.updateOutput);
    this.cssInput.addEventListener("input", this.updateOutput);
    this.jsInput.addEventListener("input", this.updateOutput);

    this.htmlInput.addEventListener("keydown", this.handleTab);
    this.cssInput.addEventListener("keydown", this.handleTab);
    this.jsInput.addEventListener("keydown", this.handleTab);

    window.addEventListener("resize", this.clearInlineStyles);

    this.loadInitialContent();
    this.updateOutput();
  }

  disconnectedCallback() {
    this.htmlInput.removeEventListener("input", this.updateOutput);
    this.cssInput.removeEventListener("input", this.updateOutput);
    this.jsInput.removeEventListener("input", this.updateOutput);

    this.htmlInput.removeEventListener("keydown", this.handleTab);
    this.cssInput.removeEventListener("keydown", this.handleTab);
    this.jsInput.removeEventListener("keydown", this.handleTab);

    window.removeEventListener('resize', this.clearInlineStyles);
  }

  loadInitialContent() {
    const template = this.querySelector("template");

    if (template) {
      const content = template.content.cloneNode(true);
      const style = content.querySelector("style");
      const script = content.querySelector("script");

      if (style) {
        this.cssInput.value = this.formatCode(style.textContent);
        style.remove();
      }

      if (script) {
        this.jsInput.value = this.formatCode(script.textContent);
        script.remove();
      }
      
      const htmlContent = Array.from(content.childNodes)
        .map(node => node.nodeType === Node.ELEMENT_NODE ? node.outerHTML : node.textContent)
        .join('');
      this.htmlInput.value = this.formatCode(htmlContent);

    } else {
      console.log("No template found inside TinyBox component");
    }
  }

  decodeHTMLEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  formatCode(str) {
    str = this.decodeHTMLEntities(str);
    const lines = str.split("\n");
    // Calculate the minimum indentation
    const minIndent = Math.min(
      ...lines
        .filter(l => l.trim())
        .map(l => l.match(/^\s*/)[0].length)
    );
    // Remove the minimum indentation from each line
    let code = lines
      .map(l => l.slice(minIndent))
      .join("\n")
      .replace(/^\s*\n/, "")  // remove leading empty lines
      .replace(/\s*$/, "");   // remove trailing whitespace and newlines
    return code;
  }

  updateOutput() {
    const doc = this.outputFrame.contentDocument;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>TinyBox Output</title>
          <style>${this.cssInput.value}</style>
        </head>
        <body>
          ${this.htmlInput.value}
          <script>${this.jsInput.value}</script>
        </body>
      </html>
    `);
    doc.close();
  }

  handleTab(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;     
      document.execCommand("insertText", false, "  ");
    }
  }

  //css resize sets height and width INLINE, so we need to clear them if user resizes the window
  clearInlineStyles() {
    if (this.container.offsetWidth < 900) {
      this.editor.style.width = '';
    } else {
      this.editor.style.height = '';
    }
  }
}

customElements.define("tiny-box", TinyBox);
