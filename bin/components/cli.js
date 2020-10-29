const fs        = require('fs');
const initSqlJs = require( './sql-wasm' );
const md5       = require( './md5' );
const path      = require('path');
const process   = require('process');

/**
 * CALL IN (REQUIRE) YOUR COMPILER FILES
 * ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
 */

const compilerDefault   = require( './compilers/default' );
const compilerShortdown = require( './compilers/jsd' );

/**
 * ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
 * END CALLING IN (REQUIRE) COMPILER FILES
 */

class CLI {

    constructor() {
        this.compilers  = {};
        this.cwd        = '';
        this.DB         = null;
        this.globalVars = {};
        this.ready      = false;
        this.readyCount = 0;
        this.settings   = {};
        this.stats      = {};
        this.SQL        = null;
        this.templates  = {};
        this.initialize();
    }

    buildCompilers() {
        let compilers = {
            'outputs': this.settings.output,
            'types': []
        };
        let list = this.settings.compile;
        for ( const prop in list ) {
            compilers.types.push( prop );
            if ( list[ prop ].toLowerCase() == 'compilerdefault' ) {
                compilers[ prop ] = 'compilerDefault';
                continue;
            }
            if ( typeof this[ list[ prop ] ] == 'function' ) {
                compilers[ prop ] = list[ prop ];
            } else {
                compilers[ prop ] = 'compilerDefault';
            }
        }
        this.compilers = compilers;
    }

    closeDatabase() {
        try {
            this.DB.close();
        } catch( err ){}
    }

    compile() {

        // Make the release directory if its missing.
        try {
            if ( ! fs.existsSync( 'release' ) ) {
                fs.mkdirSync( 'release' );
            }
        } catch( err ) {
            this.errorOut( '[ERR-06] We could not create the release directory. You may have a permission problem. We will be unable to compile a release until this is resolved.' );
        }

        // Make sure the release gitkeep file exists.
        if ( ! fs.existsSync( 'release/.gitkeep' ) ) {
            try {
                fs.writeFileSync( 'release/.gitkeep', '', { encoding: 'utf8' } );
            } catch( err ) {
                this.errorDisplay( '[ERR-07] We could not create the .gitkeep file in the release directory. You may want to manually create it if this is the only error you received.' );
            }
        }

        // Reset stats.
        this.stats = {
            'dcopied': 0,
            'dignored': -1, // Remove the current dir (parent) from the stats.
            'fcompiled': 0,
            'fskipped': 0,
            'fcopied': 0,
            'fignored': 0,
            'time': process.hrtime()
        }

        // Compile the root directory without recursion.
        this.processDirs( '.', false );

        // Compile directories listed in the settings file.
        this.settings.compileDirectories.forEach( dir => {
            this.processDirs( dir, true );
        } );

        /**
         * Compile files listed in the settings file. These are files
         * that may have been excluded by the ignoreDir setting but
         * are still wanted.
         */
        this.settings.compileFiles.forEach( file => {

            // Normalize the path to this file (if any); makes the path OS safe.
            file = path.normalize( file );
            
            // Make sure the dir path exists first or create it.
            let filename = path.parse( file ).name + path.parse( file ).ext
            let dir      = path.join( 'release', file.replace( filename, '' ) );
            if ( ! fs.existsSync( dir ) ) {
                let ext  = path.parse( dir ).ext;
                let name = path.parse( dir ).name;
                dir = dir.replace( name + ext, '' );
                fs.mkdirSync( dir, { recursive: true } );
                this.stats.dcopied += 1;
                // DO NOT ADD to the dignored count here.
            }

            // Send this file off to be compiled and saved if it needs it.
            if ( this.needsCompile( file ) ) {
                let ext = path.parse( file ).ext;
                let compiler = this.compilers[ ext.replace( '.', '' ) ];
                if ( compiler == undefined ) {
                    compiler = 'compilerDefault';
                }
                this[ compiler ]( file );
            }

        } );

        /**
         * The compiling may have updated database records.
         * Save any changes and close the database.
         */
        this.saveDatabase();
        this.closeDatabase();

        // Remove the release dir from the stats count.


        // Record process time.
        this.stats.time = this.getStatTimestamp( process.hrtime( this.stats.time ) );

    }

    /**
     * ADD COMPILER CALLS HERE
     * ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
     */

    compilerDefault( location, data, passBack ) {
        return compilerDefault.call( this, location, data, passBack );
    }

    compilerShortdown( location, data, passBack ) {
        return compilerShortdown.call( this, location, data, passBack );
    }

    /**
     * ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
     * END ADDING COMPILER CALLS
     */

    copyFileToRelease( location ) {

        let dest    = path.join( 'release', location );
        let hash    = md5( location );
        let mtime   = new Date( fs.statSync( location ).mtime );
        mtime       = mtime.toGMTString();
        let tracked = this.getFileTrackingStatus( hash, mtime );
        
        
        // Is this file untracked or missing in the release directory?
        if ( ! tracked || ! fs.existsSync( dest ) ) {

            this.stats.fcopied += 1;

            // Copy file to release directory.
            fs.copyFileSync(
                location,
                path.join( 'release', location ),
                { encoding: 'utf8' }
            );

        } else {
            this.stats.fignored += 1;
        }
    }

    /**
     * @deprecated
     */
    deleteRelease( dir ) {
        if ( dir.substring( 0, 7 ) === 'release' ) {
            try {
                if ( fs.existsSync( dir ) ) {
                    fs.readdirSync( dir ).forEach( ( file, index ) => {
                        const curPath = path.join( dir, file );
                        if ( fs.lstatSync( curPath ).isDirectory() ) {
                            // recurse
                            this.deleteRelease( curPath );
                        } else {
                            // delete file
                            fs.unlinkSync( curPath );
                        }
                    } );
                    fs.rmdirSync( dir );
                }
            } catch ( err ) {
                this.errorOut( '[ERR-09] We could not delete the release directory for a fresh compile. You should manually delete the release directory and then run the compiler again.' );
            }
        }
    }

    errorDisplay( err ) {
        err = this.wrap( err, 80 );
        console.log( '\x1B[0;31m' + err + '\x1B[0m' );
    }

    errorOut( err ) {
        err = this.wrap( err, 80 );
        console.log( '\x1B[0;31m' + err + '\x1B[0m' );
        this.closeDatabase();
        process.exit();
    }

    getFileTrackingStatus( hash, mtime ) {

        // Check if this file needs compiling based on its modified time.
        let result = this.DB.exec( "SELECT modified FROM history WHERE file = '" + hash + "';" );

        // Did we get a result?
        if ( result.length > 0 ) {

            // Yes.
            let old = result[0].values[0][0];
            if ( mtime != old ){
                this.DB.exec( "UPDATE history SET modified = '" + mtime + "' WHERE file = '" + hash + "';" );
                return false;
            }

        } else {

            // No. Start tracking this file.
            this.DB.exec( "INSERT INTO history VALUES ('" + hash + "', '" + mtime + "');" );
            return false;

        }

        return true;

    }

    getStatBlock() {
        
let block = `
====================================
Files that were compiled:       ${this.stats.fcompiled}
Files skipped compiling:        ${this.stats.fskipped}
------------------------------------
New files copied to release:    ${this.stats.fcopied + this.stats.fcompiled}
Existing files in release:      ${this.stats.fignored + this.stats.fskipped}
------------------------------------
New folders created in release: ${this.stats.dcopied}
Existing folders in release:    ${this.stats.dignored}
====================================
Compile completed in: ${this.stats.time}
`;

        return block;
    }

    getStatTimestamp( ary ) {

        let sec = ary[0];
        let ns  = ary[1];
        let ms  = ( ns / 1000000 ).toFixed( 2 );
        let min = 0;
        let hr  = 0;

        if ( sec >= 60 ) {
            min = Math.round( sec / 60 );
            sec = Math.round( 60 * ( sec / 60 % 1 ).toFixed( 4 ) );
        } 
        
        if ( min >= 60 ) {
            hr  = Math.round( min / 60 );
            min = Math.round( 60 * ( min / 60 % 1 ).toFixed( 4 ) );
        }

        if ( sec > 0 ){ sec = sec + 'sec '; } else { sec = ''; }
        if ( min > 0 ){ min = min + 'min '; } else { min = ''; }
        if ( hr > 0 ){ hr = hr + 'hr '; } else { hr = ''; }
        
        return hr + min + sec + ms + 'ms';

    }

    getTimestamp() {

        let d = new Date();

        let dy = d.getDate();
        if ( dy < 10 ){ dy = '0' + dy; }

        let mm = d.getMonth() + 1;
        if ( mm < 10 ){ mm = '0' + mm; }

        let hr = d.getHours();
        if ( hr < 10 ){ hr = '0' + hr; }

        let mn = d.getMinutes();
        if ( mn < 10 ){ mn = '0' + mn; }

        let sc = d.getSeconds();
        if ( sc < 10 ){ sc = '0' + sc; }

        let timestamp  = d.getFullYear() + '-' + mm + '-' + dy;
        timestamp     += ' @ ' + hr + ':' + mn + ':' + sc;

        return timestamp;
    }

    initialize() {

        let that = this;

        let cwd = process.cwd().split( path.sep );

        if ( cwd[ cwd.length - 1 ] == 'bin' ) {
            try {
                process.chdir( '../' );
                this.cwd = process.cwd();
            } catch ( err ) {
                this.errorOut( '[ERR-01] Node could not change your working directory. There may be permission issues keeping the compiler from running.' );
            }
        } else {
            this.cwd = cwd.join( path.sep );
            try {
                if ( ! fs.existsSync( this.cwd + path.sep + 'bin' + path.sep + 'cli.js' ) ) {
                    this.errorOut( '[ERR-03] You attempted to run the compiler from an unexpected directory, moved the compiler file, or renamed the compiler file.' );
                }
            } catch ( err ) {
                this.errorOut( '[ERR-02] Node could not check your file system. There may be permission issues keeping the compiler from running or you attempted to run it from an incorrect directory.' );
            }
        }

        try {
            this.settings = JSON.parse( fs.readFileSync( 'bin/settings.json' ) );
        } catch ( err ) {
            this.errorOut( '[ERR-04] There was an error locating or loading the settings JSON file. Make sure it exists in the bin directory and that its contents are valid JSON code.' );
        }

        // Turn on Sqlite3.
        initSqlJs().then( function( SQL ) {
            that.SQL = SQL;
            // If the database file is missing recreate it.
            let location = path.normalize( './bin/components/db.sqlite' );
            if ( ! fs.existsSync( location ) ) {
                // Create an empty file.
                fs.writeFileSync( location, '' );
                let filebuffer = fs.readFileSync( location );
                // Open the empty file and use it for our database.
                that.DB = new SQL.Database( filebuffer );
                // Create and save the database table our application needs.
                that.DB.exec( "CREATE TABLE 'history'( 'file' TEXT, 'modified' TEXT, PRIMARY KEY( 'file' ) );" );
                let data   = that.DB.export();
                let buffer = new Buffer.from( data );
                fs.writeFileSync( location, buffer );
            } else {
                // Open the existing database file.
                let filebuffer = fs.readFileSync( location );
                that.DB = new SQL.Database( filebuffer );
            }
            that.ready = true;
        } ).catch( function( err ) {
            // TODO ADD ERROR
            console.log( err )
        } );

        this.buildCompilers();

        this.loadTemplates();

        this.loadGlobals();
    }

    isReady( cmd ) {
        // Is the application ready?
        if ( this.ready ) {
            // Yes.
            this.readyCount = 0;
            return true;
        }
        // No. The database is not ready yet, have we waited to long?
        if ( this.readyCount > 12 ) {
            // Yes.
            this.errorOut( '[ERR-11] The application took to long to initialize. This is most likely caused by an issue with the database file. You may need to manually delete it or create it because of a permission problem with your installation.' );
        } else {
            // No. Wait for up to 3 seconds and check every 250ms.
            this.readyCount += 1;
            let that = this;
            setTimeout( function() {
                // Call the command that was originally called.
                that.runCmd( cmd );
            }, 250 );
        }
    }

    loadGlobals() {

        let gls = '';

        try {
            gls = fs.readFileSync( 'bin/globals', { encoding: 'utf8' } );
            gls += '\n';
        } catch ( err ) {
            this.errorOut( '[ERR-10] There was an error loading the global variable file. It could be missing or there is a permission issue.' );
        }

        let obj         = this.stripVariables( gls );
        this.globalVars = obj.vars;
        
    }

    loadTemplates() {
        let templates = {};
        let files = fs.readdirSync( 'templates' );
        files.forEach( file => {
            let name = path.parse( file ).name.toUpperCase();
            templates[ name ] = fs.readFileSync( 'templates' + path.sep + file, {
                encoding: 'utf8'
            } );
        } );
        this.templates = templates;
    }

    needsCompile( location ) {

        // Setup key variables.
        let result = false;
        let hash   = md5( location );
        let mtime  = new Date( fs.statSync( location ).mtime );
        mtime      = mtime.toGMTString();

        // Determine what the output file type should be.
        let ext = path.parse( location ).ext;
        let out = this.compilers.outputs[ ext.replace( '.', '' ) ];
        if ( ! out ) {
            // Default to HTML.
            out = 'html';
        }
        out = '.' + out;
        
        // Replace the original file and extension from the path (location).
        let name = path.parse( location ).name;
        let dest = location.replace( name + ext, name + out );
        dest     = path.join( 'release', dest );

        // If this file is missing from the release directory compile it.
        if ( ! fs.existsSync( dest ) ) {
            // Insert or update this files record; there is a 50/50 chance it needs updating.
            this.DB.exec( "INSERT OR REPLACE INTO history (file, modified) VALUES ('" + hash + "', '" + mtime + "');" );
            result = true;
        } else {
            result = ! this.getFileTrackingStatus( hash, mtime );
        }

        if ( result ) {
            this.stats.fcompiled += 1;
        } else {
            this.stats.fskipped += 1;
        }

        return result;

    }

    processDirs( dir, recursive ) {

        // Create this directory in the release folder if its missing.
        let dest = path.join( 'release', dir );
        if ( ! fs.existsSync( dest ) ) {
            this.stats.dcopied += 1;
            fs.mkdirSync( dest, { recursive: true } );
        } else {
            this.stats.dignored += 1;
        }

        // Loop through all items in this directory and process accordingly.
        let items = fs.readdirSync( dir );
        items.forEach( item => {
            let location = path.join( dir, item );
            let stats    = fs.statSync( location );
            // Is this a directory?
            if ( stats.isDirectory() && recursive == true ) {
                // Yes. Only continue if this is a safe (requested) directory.
                if ( ! this.settings.ignoreDir.includes( location ) ) {
                    this.processDirs( location, true );
                }
            } else {
                // No. Compile the file if its extension is in the compile list.
                let ext = path.parse( location ).ext.replace( '.', '' );
                if ( this.compilers.types.includes( ext ) ) {
                    // Does this file actually need to be compiled?
                    if ( this.needsCompile( location ) ) {
                        let compiler = this.compilers[ ext ];
                        this[ compiler ]( location );
                    }
                } else if ( this.settings.safeFileExtensions.includes( ext ) ) {
                    // If this file is in the safe list copy it to release; no compile needed.
                    this.copyFileToRelease( location );
                }
            }
        } );

    }

    runCmd( cmd ) {

        switch( cmd ) {
            case '':
            case ' ':
                let msg = 'You need to enter a command for the compiler to execute. Run the \x1B[1;33mhelp\x1B[0m command to get a list of available commands:\x1B[1;33mnode cli help\x1B[0m';
                console.log( this.wrap( msg, 80 ) );
                break;
            case 'help':
            case '-h':
            case '-help':
            case '--h':
            case '--help':
                this.showHelp();
                break;
            case 'compile':
                if ( this.isReady( 'compile' ) ) {
                    this.compile();
                    console.log( this.getStatBlock() );
                }
                break;
            case 'w':
                
                break;
        }

    }

    saveCompiledFile( file, dest ) {

        // Save the file to disk.
        try {
            fs.writeFileSync(
                path.join( dest ),
                file,
                { encoding: 'utf8' }
            );
        } catch ( err ) {
            this.errorDisplay( '[ERR-05] We could not save the following compiled file. If you are getting a lot of these errors there may be permission problems with the location your attempting to compile to:\n>>> ' + location + '\n' );
        }
    }

    saveDatabase() {
        let location = path.normalize( './bin/components/db.sqlite' );
        let data     = this.DB.export();
        let buffer   = new Buffer.from( data );
        fs.writeFileSync( location, buffer );
    }

    showHelp() {
        console.log( 'Help page coming soon!' );
    }

    stripVariables( file ) {

        let vars = {};
        let matches = file.match( /\${{.*}}.*\n/g );

        if ( matches ) {
            matches.forEach( match => {
                let key = match.match( /\${{(.*)}}/ )[1].toUpperCase();
                let val = match.match( /= *(?:'|')(.*)(?:'|") *;/ )[1];
                vars[ key ] = val;
                file = file.replace( match, '' );
            } );
        }

        return {
            'file': file.trim(),
            'vars': vars
        };
    }

    // Dynamic Width (Build Regex)
    // https://stackoverflow.com/a/51506718/3193156
    wrap( s, w ) {
        return s.replace(
            new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'),
            '$1\n'
        );
    }

}

module.exports = CLI;