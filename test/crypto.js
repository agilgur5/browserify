var test = require('tap').test;
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var vm = require('vm');
var concat = require('concat-stream');
var xtend = require('xtend');

var temp = require('temp');
temp.track();
var tmpdir = temp.mkdirSync({prefix: 'browserify-test'});

fs.writeFileSync(tmpdir + '/main.js', 'beep(require("crypto"))\n');

if (!ArrayBuffer.isView) ArrayBuffer.isView = function () { return false; };

function context (props) {
    return xtend({
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Uint8Array: Uint8Array,
        Int32Array: Int32Array,
        ArrayBuffer: ArrayBuffer,
        DataView: DataView,
        Object: {
            defineProperty: Object.defineProperty,
            setPrototypeOf: Object.setPrototypeOf || require('setprototypeof')
        }
    }, props);
}

test('*-browserify libs from node_modules/', function (t) {
    t.plan(2);
    
    var bin = __dirname + '/../bin/cmd.js';
    var ps = spawn(process.execPath, [ bin, 'main.js' ], { cwd : tmpdir });
    
    ps.stderr.pipe(process.stderr, { end : false });
    
    ps.on('exit', function (code) {
        t.equal(code, 0);
    });
    
    ps.stdout.pipe(concat(function (src) {
        var c = context({
            beep : function (c) {
                t.equal(typeof c.createHash, 'function');
            },
            require: function () {}
        });
        vm.runInNewContext(src.toString('utf8'), c);
    }));
});
