// Global state
let wasmReady = false;
let editors = {};
let formatTimeout = null;

// Configure Monaco loader
require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'
    }
});

// Initialize WASM module
async function initWasm() {
    try {
        await wasm_bindgen(wasmPath);
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

// Preprocess input to strip quotes and concat operators from pasted PHP/Go strings
function preprocessInput(input) {
    const trimmed = input.trim();
    if (!trimmed) return input;

    // Check if input looks like a quoted string (starts with " or ')
    const firstChar = trimmed[0];
    if (firstChar !== '"' && firstChar !== "'") {
        // Not a quoted string, return as-is
        return input;
    }

    // Determine quote style
    const quoteChar = firstChar;
    const concatOp = quoteChar === '"' ? '+' : '.';

    // Process each line
    const lines = input.split('\n');
    const processed = lines.map((line) => {
        let result = line;

        // Strip leading whitespace
        result = result.replace(/^\s*/, '');

        // Strip leading quote (exactly one)
        if (result.startsWith(quoteChar)) {
            result = result.slice(1);
        }

        // Strip trailing: whitespace, then concat op, then whitespace, then quote
        // Work backwards: first trim trailing whitespace
        result = result.replace(/\s*$/, '');

        // Check for trailing concat operator (with optional whitespace before it)
        const concatPattern = new RegExp('\\s*\\' + concatOp + '$');
        result = result.replace(concatPattern, '');

        // Trim any whitespace that was before the concat
        result = result.replace(/\s*$/, '');

        // Now strip trailing quote (exactly one)
        if (result.endsWith(quoteChar)) {
            result = result.slice(0, -1);
        }

        // Trim trailing whitespace that was inside the quotes
        result = result.replace(/\s+$/, '');

        // Unescape based on quote style
        if (quoteChar === '"') {
            // Go-style: unescape \"
            result = result.replace(/\\"/g, '"');
        } else {
            // PHP-style: unescape \'
            result = result.replace(/\\'/g, "'");
        }

        // Unescape backslashes (do this last)
        result = result.replace(/\\\\/g, '\\');

        return result;
    });

    return processed.join('\n');
}

// Format input and update all outputs
function formatInput() {
    if (!wasmReady) return;

    const timeDisplay = document.getElementById('format-time');

    let input = editors.input.getValue();
    if (!input.trim()) {
        editors.formatted.setValue('');
        editors.php.setValue('');
        editors.go.setValue('');
        timeDisplay.textContent = '';
        return;
    }

    // Preprocess to strip quotes/concat from pasted strings
    input = preprocessInput(input);

    try {
        // Get HTML-formatted output from WASM with timing from Rust side
        const { result: htmlOutput, timeMs } = wasm_bindgen.mysqlFormatTimed(input);

        // Strip HTML for Monaco compatibility
        const plainSql = stripHtml(htmlOutput);

        // Set formatted SQL output
        editors.formatted.setValue(plainSql);

        // Generate PHP and Go outputs
        editors.php.setValue(formatForPhp(plainSql));
        editors.go.setValue(formatForGo(plainSql));

        // Display execution time from Rust (microsecond precision)
        timeDisplay.textContent = `${timeMs.toFixed(3)}ms`;
    } catch (err) {
        console.error('Format error:', err);
        editors.formatted.setValue('-- Error: ' + err.message);
        editors.php.setValue('');
        editors.go.setValue('');
        timeDisplay.textContent = '';
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
    // Register custom MySQL language with proper backslash escape support
    monaco.languages.register({ id: 'mysql' });

    monaco.languages.setMonarchTokensProvider('mysql', {
        defaultToken: '',
        tokenPostfix: '.mysql',
        ignoreCase: true,

        keywords: [
            'select', 'from', 'where', 'and', 'or', 'not', 'in', 'is', 'null',
            'like', 'between', 'exists', 'case', 'when', 'then', 'else', 'end',
            'join', 'inner', 'left', 'right', 'outer', 'cross', 'natural',
            'on', 'using', 'as', 'order', 'by', 'group', 'having', 'limit',
            'offset', 'union', 'all', 'distinct', 'insert', 'into', 'values',
            'update', 'set', 'delete', 'create', 'alter', 'drop', 'table',
            'index', 'view', 'database', 'if', 'primary', 'key', 'foreign',
            'references', 'constraint', 'unique', 'default', 'auto_increment',
            'asc', 'desc', 'true', 'false', 'with', 'recursive', 'replace',
            'straight_join', 'force', 'use', 'ignore', 'partition'
        ],

        operators: [
            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
            '<>', '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|',
            '^', '%', '<<', '>>', '>>>', '<<=', '>>=', ':='
        ],

        builtinFunctions: [
            'now', 'count', 'sum', 'avg', 'min', 'max', 'concat', 'substring',
            'length', 'upper', 'lower', 'trim', 'replace', 'coalesce', 'ifnull',
            'nullif', 'cast', 'convert', 'date', 'time', 'year', 'month', 'day',
            'hour', 'minute', 'second', 'date_format', 'str_to_date', 'datediff',
            'timestampdiff', 'adddate', 'subdate', 'curdate', 'curtime', 'utc_date',
            'utc_time', 'utc_timestamp', 'unix_timestamp', 'from_unixtime',
            'abs', 'ceil', 'floor', 'round', 'mod', 'pow', 'sqrt', 'rand',
            'group_concat', 'json_object', 'json_array', 'json_extract',
            'match', 'against', 'if', 'interval'
        ],

        tokenizer: {
            root: [
                // Go template syntax
                [/\{\{/, { token: 'annotation', next: '@template' }],

                // Whitespace
                { include: '@whitespace' },

                // Numbers (including hex)
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/[\-+]?\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/[\-+]?\d+/, 'number'],

                // Strings with backslash escape support
                [/'/, { token: 'string.quote', next: '@stringSingle' }],
                [/"/, { token: 'string.quote', next: '@stringDouble' }],

                // Backtick identifiers
                [/`/, { token: 'identifier.quote', next: '@backtick' }],

                // System variables @@
                [/@@[a-zA-Z_][a-zA-Z0-9_]*/, 'variable.predefined'],

                // User variables @
                [/@[a-zA-Z_][a-zA-Z0-9_]*/, 'variable'],

                // Identifiers and keywords
                [/[a-zA-Z_][a-zA-Z0-9_]*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@builtinFunctions': 'predefined',
                        '@default': 'identifier'
                    }
                }],

                // Operators
                [/[<>=!~?:&|+\-*\/^%]+/, 'operator'],

                // Delimiters
                [/[;,.]/, 'delimiter'],
                [/[()]/, '@brackets']
            ],

            template: [
                [/\}\}/, { token: 'annotation', next: '@pop' }],
                [/./, 'annotation']
            ],

            stringSingle: [
                [/\\./, 'string.escape'],  // Backslash escapes
                [/''/, 'string.escape'],   // SQL-style escape
                [/'/, { token: 'string.quote', next: '@pop' }],
                [/./, 'string']
            ],

            stringDouble: [
                [/\\./, 'string.escape'],  // Backslash escapes
                [/""/, 'string.escape'],   // SQL-style escape
                [/"/, { token: 'string.quote', next: '@pop' }],
                [/./, 'string']
            ],

            backtick: [
                [/``/, 'identifier.escape'],
                [/`/, { token: 'identifier.quote', next: '@pop' }],
                [/./, 'identifier']
            ],

            whitespace: [
                [/\s+/, 'white'],
                [/--.*$/, 'comment'],
                [/#.*$/, 'comment'],
                [/\/\*/, { token: 'comment.quote', next: '@comment' }]
            ],

            comment: [
                [/\*\//, { token: 'comment.quote', next: '@pop' }],
                [/./, 'comment']
            ]
        }
    });

    // Define custom dark theme
    monaco.editor.defineTheme('mysql-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'string.mysql', foreground: 'ce9178' },
            { token: 'string.quote.mysql', foreground: 'ce9178' },
            { token: 'string.escape.mysql', foreground: 'd7ba7d' },
            { token: 'variable.predefined.mysql', foreground: '4fc1ff' },  // @@vars cyan
            { token: 'variable.mysql', foreground: '9cdcfe' },  // @vars light blue
            { token: 'annotation.mysql', foreground: 'dcdcaa' },  // Go templates yellow
            { token: 'identifier.mysql', foreground: '9cdcfe' },
            { token: 'identifier.quote.mysql', foreground: '808080' }  // backticks gray
        ],
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
        language: 'mysql',
        value: '',
        placeholder: 'Paste your SQL query here...'
    });

    // Formatted SQL output (readonly)
    editors.formatted = monaco.editor.create(document.getElementById('editor-formatted'), {
        ...commonOptions,
        language: 'mysql',
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
