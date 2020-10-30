const fs   = require( 'fs' );
const path = require('path');

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

    let lines = file.split( '\n' );
    let html  = '';

    let codeBlock   = false;
    let codeCounter = 0;

    let genericTags = [ 'blockquote', 'br', 'cite', 'div', 'dl', 'dt', 'hr', 'i', 'img', 'kdb', 'li', 'ol', 'p', 'strong', 'table', 'tr' ];
    let swapTags = {
        'b': 'strong',
        'bold': 'strong',
        'image': 'img',
        'italic': 'i',
        'key': 'kdb',
        'quote': 'blockquote'
    }

    lines.forEach( function( line ) {

        if ( line.length < 1 ) {
            return;
        }
        
        let startTags = line.match( /\[ *\w.*?\]/g );

        if ( startTags && startTags.length > 0 ) {

            startTags.forEach( function( startTag, startIndex ) {

                let tag = startTag.match( /\[ *\w*/ )[0].replace( '[', '' ).trim().toLowerCase();

                switch ( tag  ) {
                    case 'a':
                        line = line.replace( startTag, linkElementOpen( startTag, 'a' ) );
                        break;
                    case 'code':
                        if ( getType( startTag ).toLowerCase().trim() == 'block' ){
                            codeBlock = true;
                        }
                        line = line.replace( startTag, codeOpenElement( startTag, codeBlock ) );
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        line = line.replace( startTag, headerOpenElement( startTag ) );
                        break;
                    case 'img':
                        line = line.replace( startTag, imageOpenElement( startTag ) );
                        break;
                    case 'video':
                        line = line.replace( startTag, videoOpenElement( startTag ) );
                        break;
                    default:
                        if ( ! genericTags.includes( tag ) ) {
                            tag = swapTags[ tag ];
                        }
                        if ( tag ) {
                            line = line.replace( startTag, genericElementOpen( startTag, tag ) );
                        }
                }
               
            } );

        }

        let endTags = line.match( /\[ *\/ *\w.*?\]/g );

        if ( endTags && endTags.length > 0 ) {

            endTags.forEach( function( endTag, endIndex ) {

                let tag = endTag.match( /\[ *\/ *\w*/ )[0].replace( /\[ *?\//, '' ).trim().toLowerCase();

                switch ( tag ) {
                    case 'br':
                        line = line.replace( endTag, genericElementOpen( endTag, 'br' ) );
                        break;
                    case 'code':
                        line = line.replace( endTag, codeCloseElement( codeBlock ) );
                        codeBlock = false;
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        line = line.replace( endTag, headerCloseElement( endTag ) );
                        break;
                    case 'hr':
                        line = line.replace( endTag, genericElementOpen( endTag, 'hr' ) );
                        break;
                    case 'video':
                        line = line.replace( endTag, genericElementClose( 'a' ) );
                        break;
                    default:
                        if ( ! genericTags.includes( tag ) ) {
                            tag = swapTags[ tag ];
                        }
                        if ( tag ) {
                            line = line.replace( endTag, genericElementClose( 'a' ) );
                        }
                }

            } );

        }

        if( codeBlock ) {

            if ( codeCounter > 0 ) {
                line  = line.replace( /</g, '&lt;' );
                line  = line.replace( />/g, '&gt;' );
                line += '\n';
            } else {
                line = '\n' + line;
            }

            codeCounter++;

        } else {

            codeCounter = 0;

            if ( line.length > 0 ) {
                line = '\n' + line;
            }

        }

        if ( line.length > 0 ) {
            html += line;
        }

    } );

    html = html.replace( /^\s*[\r\n]/gm, '' );

    // Process any variables.
    html = this.compilerDefault( location, html, true );

    /**
     * If a custom compiler called our built in one they may need
     * the result back instead of us immediately saving it.
     */
    if ( passBack ) {
        return html;
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

        this.saveCompiledFile( html, dest );
    }
}

const regex = {
    'alt': new RegExp( 'alt *= *"(.*?)"', 'i' ),
    'class': new RegExp( '(?: )(\\.(?:\\w*|-*|_*)*)' ),
    'data': new RegExp( '(data-.*?) *?= *?"(.*?)', 'gi' ),
    'header': new RegExp( 'h\d' ),
    'height': new RegExp( 'height *= *"(.*?)"', 'i' ),
    'id': new RegExp( ' \\#(?:\\w*|-*|_*)*' ),
    'lang': new RegExp( 'lang *= *"(.*?)"', 'i' ),
    'map': new RegExp( 'map *= *"(.*?)"', 'i' ),
    'newtab': new RegExp( 'newtab *= *"(.*?)"', 'i' ),
    'numbers': new RegExp( '[^0-9]', 'g' ),
    'title': new RegExp( 'title *= *"(.*?)"', 'i' ),
    'type': new RegExp( 'type *= *"(.*?)"', 'i' ),
    'url': new RegExp( 'url *= *"(.*?)"', 'i' ),
    'width': new RegExp( 'width *= *"(.*?)"', 'i' )
};

function imageOpenElement( content ) {
    let elem  = '<img src="' + getUrl( content ) + '"';
    elem     += getAttributes( content );
    elem     += getAlt( content );
    elem     += getTitle( content );
    elem     += getWidth( content );
    elem     += getHeight( content );

    let m = content.match( regex.map );
    if ( m!= null ){
        elem += ' usemap="' + m[1] + '"';
    }

    return elem + '>';
}

function getAlt( content ) {
    let m = content.match( regex.alt );
    if ( m != null ){
        return ' alt="' + m[1] + '"';
    }
    return '';
}

function getAttributes( content ) {
    let attr = '';
    attr    += getId( content );
    attr    += getClasses( content );
    attr    += getDataAttributes( content );
    return attr;
}

function getClasses( content ) {
    let m = content.match( regex.class );
    if ( m != null && m.length > 0 ) {
        let elem = '';
        m.forEach( function( c ) {
            elem += ' ' + c.replace( '.', '' );
        } );
        return ' class="' + elem.trim() + '"';
    }
    return '';
}

function getDataAttributes( content ) {
    let m = content.match( regex.data );
    let a = [];
    if ( m != null ) {
        m.forEach( function( data ) {
            data = data.split( '=' ); 
            a.push( ' ' + data[0].trim() + '="' + data[1].replace( /"/g, '' ).trim() + '"' );
        } );
        return a.join( ' ' );
    }
    return '';
}

function getId( content ) {
    let m = content.match( regex.id );
    if ( m && m.length > 0 ) {
        return ' id="' + m[0].replace( '#', '' ).trim() + '"';
    }
    return '';
}

function getLanguage( content ) {
    let m = content.match( regex.lang );
    if ( m != null ){
        return ' class="lang-' + m[1].toLowerCase() + '"';
    }
    return '';
}

function getType( content ) {
    let m = content.match( regex.type );
    if ( m != null ){
        return m[1].trim();
    }
    return '';
}

function linkElementOpen( content ) {
    let elem  = '<a href="' + getUrl( content ) + '"';
    elem     += getNewtab( content );
    elem     += getAttributes( content );
    return elem + '>';
}

function getUrl( content ) {
    let m = content.match( regex.url );
    if ( m != null ){
        return m[1].trim();
    }
    return '';
}

function getNewtab( content ) {
    let m = content.match( regex.newtab );
    if ( m != null ){
        if ( m[1].toLowerCase().indexOf( 'no' ) > -1 ) {
            return ' target="_self"';
        }
    }
    return ' target="_blank"';
}

function getMap( content ) {
    let m = content.match( regex.map );
    if ( m != null ){
        return ' usemap="#' + m[1].trim() + '"';
    }
    return '';
}

function getTitle( content ) {
    let m = content.match( regex.title );
    if ( m != null ){
        return ' title="' + m[1].trim() + '"';
    }
    return '';
}

function getHeight( content ) {
    let m = content.match( regex.height );
    if ( m != null ){
        return ' height="' + m[1].replace( regex.numbers, '' ) + '"';
    }
    return '';
}

function getWidth( content ) {
    let m = content.match( regex.width );
    if ( m != null ){
        return ' width="' + m[1].replace( regex.numbers, '' ) + '"';
    }
    return '';
}


function codeCloseElement( flag ) {
    if ( flag ) {
        return '</code>\n</pre>';
    }
    return '</code>';
}

function codeOpenElement( content, flag ) {
    let elem = '';
    let lang = getLanguage( content );
    if( flag ) {
        elem += '<pre' + lang + '>\n';
    }
    elem += '<code' + lang + '>';
    return elem;
}

function genericElementClose( tag ) {
    return '</' + tag + '>';
}

function genericElementOpen( content, tag ) {
    return '<' + tag + getAttributes( content ) + '>';
}

function headerCloseElement( content ) {
    let lvl = 1;
    let m   = content.match( regex.header );
    if ( m && m.length > 0 ) {
        lvl = m[0][1];
    }
    if ( lvl < 1 ) {
        lvl = 1;
    }
    if ( lvl > 6 ) {
        lvl = 6;
    }
    return '</h' + lvl + '>';
}

function headerOpenElement( content ) {
    let lvl = 1;
    let m   = content.match( /h\d/ );
    if ( m && m.length > 0 ) {
        lvl = m[0][1];
    }
    if ( lvl < 1 ) {
        lvl = 1;
    }
    if ( lvl > 6 ) {
        lvl = 6;
    }
    return '<h' + lvl + '>';
}

function videoOpenElement( content ) {
    let elem  = '<a href="' + getUrl( content ) + '" ';
    elem     += 'data-video="' + getType( content ) + '"';
    elem     += getAttributes( content );
    return elem + '>';
}