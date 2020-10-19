const fs      = require('fs');
const process = require('process');
const path    = require('path');
const { time } = require('console');

class CLI {

    constructor() {
        this.compilers  = {};
        this.cwd        = '';
        this.globalVars = {};
        this.ready      = false;
        this.settings   = {};
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

    buildDirs( location ) {
        let ext  = path.parse( location ).ext;
        let name = path.parse( location ).name;
        location = location.replace( name + ext, '' );
        fs.mkdirSync( location, { recursive: true } );
    }

    compileDev() {

        // Compile the root directory without recursion.
        this.processCompileDir( '.', false );

        // Compile directories listed in the settings file.
        this.settings.compileDirectories.forEach( dir => {
            this.processCompileDir( dir, true );
        } );

    }

    compileRel() {

        // Delete the release directory first.
        this.deleteRelease( 'release' );

        // Re-make the release directory exists or make it.
        try {
            if ( ! fs.existsSync( 'release' ) ) {
                fs.mkdirSync( 'release' );
            }
        } catch( err ) {
            errorOut( '[ERR-06] We could not create the release directory. You may have a permission problem. We will be unable to compile a release until this is resolved.' );
        }

        // Make sure the release gitkeep file exists.
        if ( ! fs.existsSync( 'release/.gitkeep' ) ) {
            try {
                fs.writeFileSync( 'release/.gitkeep', '' );
            } catch( err ) {
                this.errorDisplay( '[ERR-07] We could not create the .gitkeep file in the release directory. You may want to manually create it if this is the only error you received.' );
            }
        }

        // Process root directory.
        this.processReleaseDir( '.' );
    }

    compilerDefault( location, passBack ) {

        // Get the file contents and pull any variables from it.
        let file = fs.readFileSync( location, { encoding: 'utf8' } );
        let obj  = this.stripVariables( file );
        let vars = obj.vars;
        file     = obj.file;

        // Add the global variables to this object.
        vars = Object.assign( vars, this.globalVars );

        // Add the compile time to this object.
        vars[ 'TIMESTAMP' ] = this.getTimestamp();

        // Build the correct relative path and add that to the variables object.
        let count = location.replace( '.' + path.sep, '' ).split( path.sep ).length;
        if ( count > 0 ) {
            count--;
        }
        let rel = '';
        while ( count > 0 ) {
            rel += '../';
            count--;
        }
        vars[ 'PATH' ] = rel;

        // Loop through template parts, replace variables as needed, then add to vars.
        let parts = this.templates;
        for( const tempProp in parts ) {
            let temp = parts[ tempProp ];
            for( const varProp in vars ) {
                let regex = new RegExp( '{{' + varProp + '}}', 'g' );
                temp = temp.replace( regex, vars[ varProp ] );
            }
            vars[ tempProp ] = temp;
        }

        // Loop through variables (which now has templates) and update the files contents.
        for( const varProp in vars ) {
            let regex = new RegExp( '{{' + varProp + '}}', 'g' );
            file = file.replace( regex, vars[ varProp ] );
        }
        
        /**
         * If a custom compiler called out built in one they may need
         * the result back instead of us immediately saving it.
         */
        if ( passBack ) {
            return file;
        } else{
            this.saveCompiledFile( file, location );
        }

    }

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
        process.exit();
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

        this.buildCompilers();

        this.loadTemplates();

        this.loadGlobals();

        this.ready = true;
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

    processCompileDir( dir, recursive ) {

        let items = fs.readdirSync( dir );
        items.forEach( item => {
            let location = dir + path.sep + item;
            let stats    = fs.statSync( location );
            if ( stats.isDirectory() ) {
                if ( recursive == true ) {
                    this.processCompileDir( location, true );
                }
            } else {
                let exe = path.parse( location ).ext.replace( '.', '' );
                if ( this.compilers.types.includes( exe ) ) {
                    let compiler = this.compilers[ exe ];
                    this[ compiler ]( location );
                }
            }
        } );

    }

    processReleaseDir( dir ) {

        let items = fs.readdirSync( dir );
        items.forEach( item => {
            let location = dir + path.sep + item;
            let stats    = fs.statSync( location );
            if ( stats.isDirectory() ) {
                let tmp = location.replace( './', '' ).replace( '.\\', '' );
                if ( ! this.settings.ignoreDir.includes( tmp ) ) {
                    this.processReleaseDir( location );
                }
            } else {
                let exe = path.parse( location ).ext.replace( '.', '' );
                if ( this.settings.safeFileExtensions.includes( exe ) ) {

                    // Build the destination path string.
                    let dest = location.replace( './', 'release/' );
                    dest     = dest.replace( '.\\', 'release\\' );

                    // Build any missing directories.
                    this.buildDirs( dest );
                    
                    // Attempt to copy the file over.
                    let that = this;
                    fs.copyFile( location, dest, 0, function( err ) {
                        if ( err ) {
                            that.errorDisplay( '[ERR-08] We could not copy a file to the release directory. The file location is below. If this is not the only error you  received you may have a permission problem with where you are attempting to run the compiler or save files to:\n>>> ' + location + '\n' );
                        }
                    } );
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
            case 'compile:dev':
            case 'compile:development':
                console.time('Compiled for development');
                this.compileDev();
                console.timeEnd('Compiled for development');
                break;
            case 'compile:rel':
            case 'compile:release':
                console.time('Compiled for release');
                this.compileDev();
                this.compileRel();
                console.timeEnd('Compiled for release');
                break;
            case 'watch':
                break;
        }
    }

    saveCompiledFile( file, location ) {

        // Determine what the output file type should be.
        let exe = path.parse( location ).ext.replace( '.', '' );
        let out = this.compilers.outputs[ exe ];
        if ( ! out ) {
            out = 'html';
        }
        out = '.' + out;
        
        // Replace the original file and extension from the path (location).
        let name = path.parse( location ).name;
        location = location.replace( name + '.' + exe, name + out );

        // Save the file to disk.
        try {
            fs.writeFileSync( location, file );
        } catch ( err ) {
            this.errorDisplay( '[ERR-05] We could not save the following compiled file. If you are getting a lot of these errors there may be permission problems with the location your attempting to compile to:\n\n' + location + '\n' );
        }
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

let cmd = process.argv.slice(2);
if ( cmd[0] ) {
    cmd = cmd[0];
} else {
    cmd = '';
}

let cli = new CLI();
cli.runCmd( cmd );