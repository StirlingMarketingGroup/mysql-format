// Global state
let wasmReady = false;
let editors = {};
let formatTimeout = null;

// Configure Monaco loader
require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs'
    }
});

// Initialize WASM module
async function initWasm() {
    try {
        await wasm_bindgen('/wasm/mysql_format_bg.wasm');
        wasmReady = true;
        // Trigger initial format if there's input
        if (editors.input && editors.input.getValue().trim()) {
            formatInput();
        }
    } catch (err) {
        console.error('Failed to initialize WASM:', err);
    }
}

// Strip HTML tags from WASM output
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Format input and update all outputs
function formatInput() {
    if (!wasmReady) return;

    const input = editors.input.getValue();
    if (!input.trim()) {
        editors.formatted.setValue('');
        editors.php.setValue('');
        editors.go.setValue('');
        return;
    }

    try {
        // Get HTML-formatted output from WASM
        const htmlOutput = wasm_bindgen.mysqlFormat(input);

        // Strip HTML for Monaco compatibility
        const plainSql = stripHtml(htmlOutput);

        // Set formatted SQL output
        editors.formatted.setValue(plainSql);

        // Generate PHP and Go outputs
        editors.php.setValue(formatForPhp(plainSql));
        editors.go.setValue(formatForGo(plainSql));
    } catch (err) {
        console.error('Format error:', err);
        editors.formatted.setValue('-- Error: ' + err.message);
        editors.php.setValue('');
        editors.go.setValue('');
    }
}

// Debounced format function
function debouncedFormat() {
    clearTimeout(formatTimeout);
    formatTimeout = setTimeout(formatInput, 100);
}

// PHP string formatting with single quotes and . concat
function formatForPhp(sql) {
    if (!sql.trim()) return '';

    const lines = sql.split('\n');
    const lastIndex = lines.length - 1;

    return lines.map((line, i) => {
        // Escape backslashes first, then single quotes
        const escaped = line
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");

        // Add . concat operator only if not last line
        const suffix = i < lastIndex ? ' .' : '';
        return "'" + escaped + "'" + suffix;
    }).join('\n');
}

// Go string formatting with double quotes and + concat
function formatForGo(sql) {
    if (!sql.trim()) return '';

    const lines = sql.split('\n');
    const lastIndex = lines.length - 1;

    return lines.map((line, i) => {
        // Escape backslashes first, then double quotes
        const escaped = line
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');

        // Add + concat operator only if not last line
        const suffix = i < lastIndex ? ' +' : '';
        return '"' + escaped + '"' + suffix;
    }).join('\n');
}

// Initialize Monaco editors
require(['vs/editor/editor.main'], function() {
    // Define custom dark theme
    monaco.editor.defineTheme('mysql-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#1e1e1e',
            'editor.lineHighlightBackground': '#2a2a2a'
        }
    });

    // Common editor options
    const commonOptions = {
        theme: 'mysql-dark',
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        renderLineHighlight: 'line',
        padding: { top: 8, bottom: 8 },
        scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
        }
    };

    // Input editor (editable)
    editors.input = monaco.editor.create(document.getElementById('editor-input'), {
        ...commonOptions,
        language: 'sql',
        value: '',
        placeholder: 'Paste your SQL query here...'
    });

    // Formatted SQL output (readonly)
    editors.formatted = monaco.editor.create(document.getElementById('editor-formatted'), {
        ...commonOptions,
        language: 'sql',
        readOnly: true,
        value: ''
    });

    // PHP output (readonly)
    editors.php = monaco.editor.create(document.getElementById('editor-php'), {
        ...commonOptions,
        language: 'php',
        readOnly: true,
        value: ''
    });

    // Go output (readonly)
    editors.go = monaco.editor.create(document.getElementById('editor-go'), {
        ...commonOptions,
        language: 'go',
        readOnly: true,
        value: ''
    });

    // Real-time formatting on input change
    editors.input.onDidChangeModelContent(debouncedFormat);

    // Select all text on focus for easy copying
    Object.entries(editors).forEach(([name, editor]) => {
        editor.onDidFocusEditorText(() => {
            // Small delay to ensure focus is complete
            setTimeout(() => {
                const model = editor.getModel();
                if (model) {
                    editor.setSelection(model.getFullModelRange());
                }
            }, 50);
        });
    });

    // Focus input editor on load
    editors.input.focus();

    // Initialize WASM
    initWasm();
});
