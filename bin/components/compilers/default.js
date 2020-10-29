// compilerDefault
const fs   = require( 'fs' );
const path = require( 'path' );

module.exports = function( location, data, passBack ) {

    // Determine if we need to load the file or if we were sent the data already.
    let file = '';

    if ( data != undefined ) {
        if ( data.length > 2 ) {
            file = data;
        }
    }

    if ( file.length < 2 ) {
        file = fs.readFileSync( location, { encoding: 'utf8' } );
    }

    // Get the file contents and pull any variables from it.
    let obj  = this.stripVariables( file );
    let vars = obj.vars;
    file     = obj.file;

    // Add the compile time to the variables object.
    vars[ 'TIMESTAMP' ] = this.getTimestamp();

    // Add the global variables the variables object.
    vars = Object.assign( vars, this.globalVars );

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

    // Loop through the template parts replacing variables with their values.
    let parts = this.templates;
    for( const tempProp in parts ) {
        let temp = parts[ tempProp ];
        for( const varProp in vars ) {
            let regex = new RegExp( '{{' + varProp + '}}', 'g' );
            temp = temp.replace( regex, vars[ varProp ] );
        }
        // Replace template variables with their actual values in the file.
        let regex = new RegExp( '{{' + tempProp + '}}', 'g' );
        file = file.replace( regex, temp );
    }

    // Replace variables with their actual values in the file.
    for( const varProp in vars ) {
        let regex = new RegExp( '{{' + varProp + '}}', 'g' );
        file = file.replace( regex, vars[ varProp ] );
    }

    /**
     * If a custom compiler called our built in one they may need
     * the result back instead of us immediately saving it.
     */
    if ( passBack ) {
        return file;
    } else {

        // Determine what the output file type should be.
        let ext  = path.parse( location ).ext;
        let name = path.parse( location ).name;
        let out  = this.compilers.outputs[ ext.replace( '.', '' ) ];
        if ( ! out ) {
            // Default to HTML.
            out = 'html';
        }
        out = '.' + out;

        // Build the path to the destination.
        let dest = location.replace( name + ext, name + out );
        dest     = path.join( 'release', dest );

        this.saveCompiledFile( file, dest );
    }

}