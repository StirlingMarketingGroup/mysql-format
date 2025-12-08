// Unit tests for preprocessInput function
// Run with: node preprocess.test.js

// The function we're testing
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
    const processed = lines.map((line, index) => {
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

// Test framework
let passed = 0;
let failed = 0;

function test(name, input, expected) {
    const result = preprocessInput(input);
    if (result === expected) {
        console.log(`✓ ${name}`);
        passed++;
    } else {
        console.log(`✗ ${name}`);
        console.log(`  Input:    ${JSON.stringify(input)}`);
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Got:      ${JSON.stringify(result)}`);
        failed++;
    }
}

// Test cases
console.log('\n=== Go-style (double quotes with +) ===\n');

test('Basic Go string',
    `"select @@Columns "+
"from\`shipments\` "+
"where\`ParentShipmentID\`=@@ParentShipmentID "+
"and\`__Active\`<>0"`,
    `select @@Columns
from\`shipments\`
where\`ParentShipmentID\`=@@ParentShipmentID
and\`__Active\`<>0`
);

test('Go string with indentation',
    `"select @@Columns "+
        "from\`shipments\` "+
        "where\`ParentShipmentID\`=@@ParentShipmentID "+
        "and\`__Active\`<>0"`,
    `select @@Columns
from\`shipments\`
where\`ParentShipmentID\`=@@ParentShipmentID
and\`__Active\`<>0`
);

test('Go string - last line no concat',
    `"select * "+
"from users"`,
    `select *
from users`
);

console.log('\n=== PHP-style (single quotes with .) ===\n');

test('Basic PHP string',
    `'select @@Columns ' .
'from\`shipments\` ' .
'where\`ParentShipmentID\`=@@ParentShipmentID ' .
'and\`__Active\`<>0'`,
    `select @@Columns
from\`shipments\`
where\`ParentShipmentID\`=@@ParentShipmentID
and\`__Active\`<>0`
);

test('PHP string with escaped quote',
    `'it\\'s a test'`,
    `it's a test`
);

test('PHP string with escaped backslash',
    `'path\\\\to\\\\file'`,
    `path\\to\\file`
);

console.log('\n=== Escaped characters ===\n');

test('Go string with escaped double quote',
    `"he said \\"hello\\""`,
    `he said "hello"`
);

test('Go string with escaped backslash',
    `"path\\\\to\\\\file"`,
    `path\\to\\file`
);

test('Go multiline with escaped quotes',
    `"select * from users where name = \\"John\\" "+
"and status = 'active'"`,
    `select * from users where name = "John"
and status = 'active'`
);

console.log('\n=== Raw SQL (no quotes) ===\n');

test('Raw SQL unchanged',
    `select * from users where id = 1`,
    `select * from users where id = 1`
);

test('Raw SQL with backticks unchanged',
    `select * from \`users\` where \`id\` = 1`,
    `select * from \`users\` where \`id\` = 1`
);

console.log('\n=== Edge cases ===\n');

test('Query with string containing plus',
    `"select * from users where name = 'a+b' "+
"and id = 1"`,
    `select * from users where name = 'a+b'
and id = 1`
);

test('Empty input',
    ``,
    ``
);

test('Whitespace only',
    `   `,
    `   `
);

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
