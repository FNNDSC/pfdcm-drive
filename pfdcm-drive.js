/////////
///////////////////////////
///////// Object prototypes 
///////////////////////////
/////////

/////////
///////// Debug object
/////////
/*
    This object provides a simple tool for simple debugging --
    mostly entering and exiting functions, printing some 
    state, etc.
*/

function Debug(d) {
    /*
    Print some debugging info to console.

    d.functionName      string      name of function
    d.message           string      message
    d.let               let         letiable to print

    */

    this.functionName   = '<void>';
    this.message        = '<void>';
    this.let            = null;
    this.tab            = 0;

    if (d.constructor == Object) {
        prototype.argcheck(d)
    }

    if(typeof(d) === 'string' || d instanceof String) {
        this.functionName   = d
    }

}

Debug.prototype = {

    constructor:    Debug,

    argcheck:       function (d) {
        if (typeof (d.functionName) != 'undefined')
            this.functionName = d.functionName;
        if (typeof (d.message) != 'undefined')
            this.message = d.message;
        if (typeof (d.let) != 'undefined')
            this.let = d.let;
    },

    cl:             function () {
        console.log(' ');
    },

    indent:         function () {
        str_indent = '';
        for (i = 0; i < this.tab; i++)
            str_indent = str_indent + '\t';
        return str_indent;
    },

    entering:       function () {
        functionCallDepth += 1;
        this.tab = functionCallDepth;
        console.log(
            this.indent()           + 
            '--------> Entering '   + 
            this.functionName       + 
            '...');
    },

    leaving:        function () {
        console.log(
            this.indent()       + 
            'Leaving '          + 
            this.functionName   + 
            ' --------> ');
        functionCallDepth -= 1;
    },

    vlog:           function (d) {
        this.argcheck(d);
        if (typeof (this.let) === 'object') {
            console.log(
                this.indent()               + 
                'In ' + this.functionName   + 
                ': ' + d.message + ' = '
            );
            console.log(d.let);
        } else
            console.log(
                this.indent()               + 
                'In ' + this.functionName   + 
                ': ' + d.message    + ' = ' + d.let);
    },

    log:            function (d) {
        this.argcheck(d);
        console.log(
                this.indent()               + 
                'In ' + this.functionName + ': ' + d.message);
    }

}

/////////
///////// DOM object
/////////

function DOM(al_keylist) {
    this.str_help = `
    This object provides a convenient abstraction
    for accessing and interacting with named components 
    of the DOM, removing the very tight coupling that 
    might occur by referening DOM literals directly in JS.
    `;
    this.l_DOM = al_keylist;
}

DOM.prototype = {
    constructor:    DOM,

    elements:           function() {
        return this.l_DOM;
    },

    get:                function(str_key) {
        if(this.l_DOM.includes(str_key)) {
            return $('#'+str_key).val()
        } else {
            return null;
        }
    },

    html:               function(str_key, str_val) {
        if(this.l_DOM.includes(str_key)) {
            $('#'+str_key).html(str_val)
        }
    },

    innerHTML_listadd:  function(str_key, l_val) {
        if(this.l_DOM.includes(str_key)) {
            for(const str_line of l_val) {
                document.getElementById(str_key).innerHTML += str_line;
            }
        }
    },

    innerHTML_listset:  function(str_key, l_val) {
        if(this.l_DOM.includes(str_key)) {
            document.getElementById(str_key).innerHTML = '';
            for(const str_line of l_val) {
                document.getElementById(str_key).innerHTML += str_line;
            }
        }
    },

    set:                function(str_key, str_val) {
        if(this.l_DOM.includes(str_key)) {
            $('#'+str_key).val(str_val)
            return $('#'+str_key).val();
        } else {
            return null;
        }
    }
}

/////////
///////// URL object
/////////

function URL(dom) {
    this.str_help   = `
    This object parses the URL for parameters to set in the 
    dashboard.
    `;
    this.dom        = dom;
    this.str_query  = window.location.search;
    this.urlParams  =  new URLSearchParams(this.str_query);
}

URL.prototype = {
    constructor:    URL,

    parse:          function() {
        this.dom.elements().forEach(el => {
            if(this.urlParams.has(el)) {
                this.dom.set(el, this.urlParams.get(el));
            }
        })
    }
}

/////////
///////// PFResponse object
/////////

function PFResponse(response) {
    this.help = `
        The PFResponse processes the rather idiosyncratic return
        from PF-family services.
    `;
 
    this.response           = response;

    // The raw string response can be "funky"
    this.str_responseRaw    = '';
    this.json_response      = {};

    this.l_headerResponse   = [];
    this.l_bodyResponse     = [];
    this.str_bodyResponse   = '';
    this.l_response         = [];

    // This is more regular "sanitized" string response
    this.str_response       = '';

    this.response_typeParse(response);

};   

PFResponse.prototype = {
    constructor:    PFResponse,

    response_typeParse: function(response) {
        switch(typeof(response)) {
            case    'undefined':
                break;
            case    'string':
                this.str_responseRaw    = response;
                break;
            case    'object':
                this.json_response      = response;
                break;
        };
    },

    set:        function(response) {
        this.response_typeParse(response);
    },

    str_get:    function() {
        return(this.str_responseRaw);
    },

    response_bodyStringUpdate:      function(str_body, ab_JSONupdate) {

        let str_help    = `

            If the body string has been updated by some mechanism,
            this method reconstructs various internals to be in
            sync with the new body.

            If the optional <b_JSONupdate> is true, then the
            json dictionary is also updated.

        `;

        b_JSONupdate    = false;
        
        switch(typeof(ab_JSONupdate)) {
            case    'undefined':
                break;
            case    'boolean':
                b_JSONupdate    = ab_JSONupdate;
                break;
        }

        this.str_bodyResponse   = str_body;
        if(ab_JSONupdate)
            this.json_response  = JSON.parse(this.str_bodyResponse);
        this.l_bodyResponse     = this.str_bodyResponse.split('\n');

        this.l_response         = this.l_headerResponse.concat(this.l_bodyResponse);
        this.str_response       = this.l_response.join('\n');
    },

    responseHTML_parseHeadBody:     function() {
        let str_help    = `

            Split the HTML string response from the remote 
            pf-family server into the header and body components
            as well as a JSON representation of the body.

        `;

        this.l_headerResponse   = this.str_responseRaw.split('\r');

        // The 4th element of the l_headerReponse contains the actual
        // stringified JSON body return payload. We need to set the body 
        // to that index element and then split on '\n' to create list of 
        // lines for the body 
        this.str_bodyResponse   = this.l_headerResponse[4];
        this.json_response      = JSON.parse(this.str_bodyResponse);
        this.l_bodyResponse     = this.str_bodyResponse.split('\n');

        // Remove the "body" from the orignal header list
        this.l_headerResponse.pop();

        this.l_response         = this.l_headerResponse.concat(this.l_bodyResponse);
        this.str_response       = this.l_response.join('\n');
    },

    parse:                          function() {
        let str_help = `

            Mostly a convenience function that calls the responseHTML_parseHeadBody
            method.

        `;

        this.responseHTML_parseHeadBody();
    }
}

/////////
///////// MSG object
/////////

function MSG(d_comms) {
    this.help = `
    The MSG object primarily does two things:

        *   it is responsible for generating the actual message payload
            to transmit to a remote service
        *   it has a concept of where in the DOM to "write" results
        
    In this fashion, the MSG object is the proverbial contact surface 
    between idiosyncracies of the remote service (the actual message 
    construct that the service understands) and also needs to know what
    element on the main HTML page is associated with the results of this
    message.

    As such there is an implicit coupling between this object and the 
    syntax of the remote server as well as the named elements in the DOM.
    `;

    // parameters governing the message comms
    this.d_comms            = d_comms;

    // the page we're acting within
    this.page               = d_comms['page'];

    // info on this *specific* message: the payload to transmit and
    // the destination
    this.payload            = '';
    this.str_schemeAuthPath = '';

    // The actual response received from this message object
    this.pfresponse         = new PFResponse();

     // A string key linking this message object to a component 
     // on the HTML page
     this.str_DOMkey         = '';
}

MSG.prototype = {
    constructor:    MSG,

    APIschemeAuthPath_build:    function() {
        str_help = `
        Return the first part of the API call, typically the
        http://<host>[:<IP>][/path]
        `;

        return(this.d_comms['scheme']               +
               '://'                                +
               this.page.DOMurl.get('pfdcm_IP')     +
               ':'                                  +
               this.page.DOMurl.get('pfdcm_port')   +
               this.d_comms['path']);
    },

    hello:                      function() {
        str_help = `
        Return the JSON payload for a 'hello' message.
        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pfdcm';
        let d_msg = {
            "action": "hello",
            "meta": {
                "askAbout": "sysinfo",
                "echoBack": "greetings"
            }
        };   
        return(d_msg);    
    },

    pfdcm_get:                  function() {
        str_help = `
        Return the JSON payload for a 'pfdcm_get' message.
        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pfdcm';
        let d_msg = {
            "action": "internalctl",
            "meta": {
                "var":      this.page.DOMpfdcm.get('pfdcm_get'),
                "get":      "value"
            }
        };
        return(d_msg);    
    },

    pfdcm_set:                  function() {
        str_help = `
        Set the 'pfdcm' PACS detail based on page input data fields.
        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pfdcm';
        d_PACSinfo              = {
                'serverIP':         this.page.DOMpacsdetail.get('PACS_IP'), 
                'aet':              this.page.DOMpacsdetail.get('PACS_AET'), 
                'aec':              this.page.DOMpacsdetail.get('PACS_AEC'), 
                'serverPort':       this.page.DOMpacsdetail.get('PACS_port') 
        };

        let str_serviceName     = this.page.DOMpacsdetail.get('PACS_name');

        d_set   = {
            [str_serviceName]: d_PACSinfo
        };

        let d_msg = {
            "action": "internalctl",
            "meta": {
                "var":      "/PACS",
                "set":      d_set
            }
        };

        // Set the status button on the HTML page
        let PACS_config         = document.getElementById("config_PACS-opener");
        PACS_config.innerHTML   = 'Config PACS: Set';
        PACS_config.className   = 'button-xsmall button-help-green pure-button';
        
        return(d_msg);    
    },

    queryFields_determine:      function() {
        let str_help = `
            This method examines the query fields in the DOM and constructs an
            appropriate query dictionary.
        `;
        let d_query= {};

        for(const str_queryKey of this.page.DOMpacsQR.elements()) {
            if(this.page.DOMpacsQR.get(str_queryKey).length) {
                d_query[str_queryKey] = this.page.DOMpacsQR.get(str_queryKey)
            }
        }
        return(d_query);
    },

    PACS_query:                  function() {
        let str_help = `
            The main entry point to performing a PACS Query.
        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pacs';
        let str_serviceName     = this.page.DOMpacsdetail.get('PACS_name');
        let d_on                = this.queryFields_determine();

        this.page.PACS_TERMynal.clear([
            '<span data-ty>... PERFORMING QUERY ...</span>',
            '<span data-ty>... Please be patient while running ...</span>'
        ]);

        let d_msg = {
            "action": "PACSinteract",
            "meta": {
                "do":       "query",
                "on":       d_on,
                "PACS":     str_serviceName
            }
        };
        return(d_msg);    
    },

    response_print:                 function(pfresponse) {

        if(this.str_DOMkey == 'termynal_pfdcm') {
            this.page.pfdcm_TERMynal.response_print(pfresponse)
        }
        if(this.str_DOMkey == 'termynal_pacs') {
            this.page.PACS_TERMynal.response_print(pfresponse)
        }
    }
}

/////////
///////// AJAX abstraction object
/////////

function AJAX(Msg) {
    this.str_help = `
        The AJAX object specifies communication basics using
        the jQuery $.ajax(...) mechanism. 

        The design pattern normalizes usage between the two
        backend infrastructure engines, the AJAX and Fetch.
    `;
    this.SRVresp        = null;
    this.json_SRVresp   = null;
    this.TX             = Msg;
}

AJAX.prototype = {
    constructor:    AJAX,

    onError_callBack:       function (xhdr, textStatus, thrownError) {
        hdr = null;
        console.log('Some error was triggered.');
        console.log('textStatus         = ' + textStatus);
        console.log('xhdr.statusText    = ' + xhdr.statusText);
        console.log('xhdr.responseText  = ' + xhdr.responseText);
        console.log('xhdr.status        = ' + xhdr.status);
        console.log('thrownError        = ' + thrownError);
        let str = JSON.stringify(xhdr.responseText, null, 2);
        output(syntaxHighlight(xhdr.status));
        hdr = xhdr;
    },

    onBefore_callBack:      function () {
        let debug = new Debug("AJAX.onBefore_callback");
        debug.entering();
        debug.leaving();
    },

    onComplete_callBack:    function (jqXHR, textStatus) {
        let debug = new Debug("AJAX.onComplete_callBack");
        debug.entering();
        debug.leaving();
    },

    onSuccess_callBack:     function (SRVresp, textStatus, jqXHR) {
        /*
            This is an asynchronous function, so when a button in UI
            is hit triggering a REST call, internal state is not 
            updated until this function is called.
        */

        let debug = new Debug("AJAX.onSuccess_callback");
        debug.entering();

        debug.vlog({ 'message': 'SRVresp', let: SRVresp });

        debug.leaving();
    },

    transmitAndProcess: function (payload) {
        $.ajax({
            type:           this.TX.d_comms['VERB'],
            url:            this.TX.str_schemeAuthPath,
            crossDomain:    true,
            dataType:       this.TX.d_comms['type'],
            data:           payload,
            async:          false,
            beforeSend:     this.onBefore_callBack,
            complete:       this.onComplete_callBack,
            success:        this.onSuccess_callBack,
            error:          this.onError_callBack   
        })
    },
}

function Fetch(Msg) {
    let help = `
        The Fetch object specifies communication basics using
        the fetch(...) mechanism. 

        The passed Msg object contains the payload and comms
        parameters for transmission (hence TX), while returned
        data is captured in the Fetch object itself.
    `;
    this.SRVresp        = null;
    this.json_SRVresp   = null;
    this.TX             = Msg;
    this.TXoptions      = {};
    this.fetchRetries   = 5;
    this.payload        = '';
    this.reponse        = null;
}

Fetch.prototype = {
    constructor: Fetch,

    postData: async function (url = '', data = {}) {
        let str_help = `
            Note that "weird" behaviour in comms is most often
            linked to parameter settings below. For example, sending
            any 'headers' seems to trigger an OPTIONS verb in the
            server irrespective of the 'method' value.
        `;

        let debug = new Debug("Fetch.postData");
        debug.entering();

        this.response  = await fetch(url, this.TXoptions);
        debug.leaving();
        return this.response.text();
    },

    checkFirstForErrorsInResponse:  function (response) {
        let debug = new Debug("Fetch.checkFirstForErrorsInResponse");
        debug.entering();

        debug.vlog({ 'message': '\nresponse', let: response });

        // Some parsing on 'reponse' for an error condition,
        // possibly reponse.ok if a Response object is passed
        if (!response.ok) {
            throw Error(response.statusText);
        }

        debug.leaving();
        return response;
    },

    handleReponse:  function (response) {
        let debug = new Debug("Fetch.handleResponse");
        debug.entering();

        console.log(response);
        this.TX.pfresponse.set(response);
        this.TX.pfresponse.parse();
        this.TX.response_print(this.TX.pfresponse);
        debug.leaving();

        return response;

    },

    handleErrorsInFetch:  async function (response) {
        let debug = new Debug("Fetch.handleErrorsInFetch");
        debug.entering();
        debug.vlog({ 'message': '\nresponse', let: response });

        console.log('attempting to call again!');

        this.response   = await this.fetch_retry(
                                this.TX.str_schemeAuthPath, 
                                this.TXoptions, 
                                this.fetchRetries
                        );

        debug.leaving();
        return await response.text();
    },

    fetch_retry:    async (url, options, n) => {
        let debug = new Debug("Fetch.fetch_retry");
        debug.entering();

        let error;
        for(let i=0; i<n; i++) {
            try {
                return await fetch(url, options);
            } catch(err) {
                error =err;                
            }
        }
        debug.leaving();
        throw error;
    },

    transmitAndProcess: async function (payload) {
        this.payload    = payload;
        this.TXoptions  = {
            method:         this.TX.d_comms['VERB'],    // *GET, POST, PUT, DELETE, etc.
            mode:           'cors',                     // no-cors, *cors, same-origin
            cache:          'no-cache',                 // *default, no-cache, reload, force-cache, only-if-cached
            credentials:    'same-origin',              // include, *same-origin, omit
            headers: {      'Content-Type': 'text/plain'},
            redirect:       'follow',                   // manual, *follow, error
            referrerPolicy: 'no-referrer',              // no-referrer, *client

            // body data type must match "Content-Type" header
            body: JSON.stringify(payload)
        };

        try {
            str_response  = await this.postData(this.TX.str_schemeAuthPath, payload);
        } catch(e) {
            this.handleErrorsInFetch(e);
        } finally {
            this.handleReponse(str_response);
        }
    },

}

/////////
///////// REST calling object
/////////

function REST(d_comms) {
    this.help = `
        The REST object handles communication with a server
        process.

        One of two core backends are available, specified
        by the 'commsBackend' passed in the <d_comms>
        dictionary:

            'fetch':        Uses the new fetch() API, which
                            is cleaner and preserves nested
                            JSON dictionaries transmitted
                            to server. This is the preferred
                            method.

            'ajax':         Uses the jQuery $.ajax() infrastructure
                            and provided more for historical
                            purposes. Note this method
                            flattens transmitted JSON
                            dictionaries.
    `;
    // The msg contains all data necessary for comms:
    //      remote address, payload, header info etc.
    this.msg                = new MSG(d_comms);
    this.SRVresp            = null;     // Raw reponse
    this.json_SRVresp       = null;     // JSONified response

    switch(d_comms['clientAPI']) {
        case 'Fetch':   
            this.clientAPI  = new Fetch(this.msg);
            break;
        case 'Ajax':
            this.clientAPI  = new AJAX(this.msg)
            break;
    }
}

REST.prototype = {
    constructor:            REST,

    hello:                  function() {
        let str_help = `
        Say hello to pfdcm
        `;
        this.transmitAndProcess(this.msg.hello());
    },

    pfdcm_get:              function() {
        let str_help = `
        Say hello to pfdcm
        `;
        this.transmitAndProcess(this.msg.pfdcm_get());
    },

    pfdcm_set:              function() {
        let str_help = `
        Set pfdcm internals based on the contents of page input fields.
        `;
        this.transmitAndProcess(this.msg.pfdcm_set());
    },

    PACS_query:             function() {
        let str_help = `
        Do a PACS Query.
        `;
        this.transmitAndProcess(this.msg.PACS_query());
    },

    do:                     function(d_op) {
        if('operation' in d_op) {
            switch(d_op['operation']) {
                case 'hello':       this.hello();
                                    break;
                case 'pfdcm_get':   this.pfdcm_get();
                                    break;
                case 'pfdcm_set':   this.pfdcm_set();
                                    break;
                case 'PACS_query':  this.PACS_query();
                                    break;
            }
        }
    },

    transmitAndProcess: function(payload) {
        this.clientAPI.transmitAndProcess(payload);
    },

}

/////////
///////// TERMynal calling object
/////////

String.prototype.paddingLeft = function (paddingValue) {
    return String(paddingValue + this).slice(-paddingValue.length);
};

function TERMynal(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        The TERMynal object controls/mediates access and contents of any
        termynals on the html page.

    `;

    // The "key" element of this termynal on the html page
    this.str_DOMkey             = str_DOMkey;
    this.DOMoutput              = DOMoutput;

    // Various settings, including colors, rows, etc
    this.d_settings             = d_settings;

    this.page                   = d_settings.page;
    this.contents               = null;

    // A list containing the "default" text to diplay when a screen is cleared.
    this.l_screenClearDefault   = []

}

TERMynal.prototype = {
    constructor:            TERMynal,

    screenClear_setDefault: function(l_lines) {
        let str_help = `

                Simply set the lines to display when termynal "screen" is "cleared".

        `;

        this.l_screenClearDefault   = l_lines;
    },

    clear:                  function(l_screenLines) {
        let str_help = `
        
                Clear the termynal "screen" and optionally set some 
                default "text" on the "screen".

        `;

        let l_lines     = [];

        if(typeof(l_screenLines) != 'undefined') {
            if(Array.isArray(l_screenLines))
                l_lines     = l_screenLines
        } else
            l_lines = this.l_screenClearDefault;

        this.page.DOMtermynal.innerHTML_listset(this.str_DOMkey, l_lines);
    },

    syntaxHighlight:            function(json, ab_subSpaces = false) {
        let str_help = `

            Convert an input string to colorized html string suitable
            for termynal. Note the return from this function still needs to
            split into a list!

        `;
        if(ab_subSpaces) 
            json    = json.replace(/ /g, "&nbsp;");
        json    = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    },

    to_termynalResponseGenerate_fromText:   function(str_text, ab_trimLeft, astr_style) {
        let str_help = `

            Prepare a list containing all the lines that should be
            streamed to a target termynal.

            Convert a multi-line list of response-string to termynal
            friendly html. Each line of response string needs its
            own html tagged line of form:

                    <span data-ty>some string...</span>

            This method is a simplified version of the more complete
            to_terymalResponseGenerate()

        `;
        let str_style   = '';
        let l_termynal  = [];
        // Sanitize the string of any spurious ANSI color codes...
        str_text        = str_text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")
        let l_response  = str_text.split('\n')

        switch(typeof(astr_style)) {
            case    'undefined':
                break;
            case    'string':
                str_style   = astr_style;
                break;
        }

        l_termynal = this.sprintf(l_response, ab_trimLeft, str_style);
        return(l_termynal);
    },

    to_termynalResponseGenerate:    function(pfresponse, astr_style) {
        let str_help = `

            Prepare a list containing all the lines that should be
            streamed to a target termynal.

            Convert a multi-line list of response-string to termynal
            friendly html. Each line of response string needs its
            own html tagged line of form:

                    <span data-ty>some string...</span>

            This method not only performs the to-termynalization
            but also attempts some indenting if syntax highlighting
            has been 

        `;
        let str_style   = '';
        switch(typeof(astr_style)) {
            case    'undefined':
                break;
            case    'string':
                str_style   = astr_style;
                break;
        }

        // The array to hold all the lines for the termynal
        let l_termynal      = [];
        let b_subSpaces     = false;
        let b_trimLeft      = false;

        // Check for optional JSON syntax highlighting. If true, 
        // then the response body needs to be syntaxed -- as a 
        // string, and then split back into a list.
        if(this.page.b_jsonSyntaxHighlight) {
            b_subSpaces         = true;
            str_jsonColorized   = this.syntaxHighlight(pfresponse.str_bodyResponse, b_subSpaces);
            str_jsonColorized   = str_jsonColorized.replace(/&amp;/g, "&");

            pfresponse.response_bodyStringUpdate(str_jsonColorized);
        }

        b_subSpaces     = false;
        l_termynal      = this.sprintf(pfresponse.l_response, b_trimLeft, '', b_subSpaces);
        return(l_termynal);
    },

    sprintf:                    function(al_lines, 
                                            ab_trimLeft         = false, 
                                            astr_groupStyle     = '',
                                            ab_subSpaces        = true) {
        let str_help = `

            A simple method that takes a list of "lines" and makes them
            termynal friendly.

        `;

        let l_termynal  = [];
        for(str_line of al_lines) {
            if(str_line.length) {
                if(ab_trimLeft)  str_line    = str_line.trimStart();
                if(ab_subSpaces) str_line    = str_line.replace(/ /g, "&nbsp;");
                l_termynal.push("<span data-ty " + astr_groupStyle +" >" + str_line + "</span>");
            }                
        }
        return(l_termynal);
    },

    ltag_wrapLineGroup:         function(astr_prefix, al_lines, astr_suffix) {
        let str_help = `

            Wrap around the list of lines in <al_lines>, creating a new list:

            [
                <astr_prefix>,
                [<al_lines>]
                <astr_suffix>,
            ]
        `;

        let l_termynal  = [];
        l_termynal.push(astr_prefix);
        l_termynal      = l_termynal.concat(al_lines);
        l_termynal.push(astr_suffix);
        return(l_termynal);
    },


    lineBlock_packageAndStyle:  function(al_line, 
                                            astr_groupStyle     = '"', 
                                            astr_elementOpen    = '', 
                                            astr_elementClose   = '') {
        let str_help = `
    
            Wraps a block of TERMynal lines in a div block with styling to
            reduce the height and apply optional additional styling.
    
        `;

        let l_divBlock      = '';
        l_divBlock          = this.ltag_wrapEachLine(
            '<div style="display: flex; height:20px;' + astr_groupStyle + '>' + astr_elementOpen,
            al_line,
            astr_elementClose + '</div>'
        );
        return(l_divBlock);
    },
    
    ltag_wrapEachLine:          function(astr_prefix, al_lines, astr_suffix) {
        let str_help = `

            Wrap around each line in <al_lines>, creating a new string:

                <astr_prefix><str_line><astr_suffix>

            Some character substitution is performed. If the <astr_prefix>
            contains:

                '&':        replaced by the current study index
                '%':        replaced by the current series index

        `;

        let l_termynal  = [];
        let seriesCount = 1;
        let str_prefix  = astr_prefix;
        for(str_line of al_lines) {
            str_currentStudy    = (this.currentStudyIndex+1).toString().padStart(4, ' ');
            str_prefix = str_prefix.replace('/StudyIndex/', str_currentStudy);
            str_seriesCount     = (seriesCount).toString().padStart(2, '0');
            str_prefix = str_prefix.replace('/SeriesCount/', str_seriesCount);
            l_termynal.push(str_prefix + str_line + astr_suffix);
            seriesCount++;
            str_prefix = astr_prefix;
        }
        return(l_termynal);
    },

    tprintf:                    function(al_lines) {
        let str_help = `

            A simple method that takes a list of "lines" and "prints"
            them in a termynal.

        `;

        this.DOMoutput.innerHTML_listadd(this.str_DOMkey, al_lines);
    }
}

/////////
///////// TERMynal_pfdcm calling object with some specializations
/////////

function TERMynal_pfdcm(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        A pfdcm "specialized" class of the base TERMynal.

    `;

    TERMynal.call(this, str_DOMkey, DOMoutput, d_settings);
}

TERMynal_pfdcm.prototype                = Object.create(TERMynal.prototype);
TERMynal_pfdcm.prototype.constructor    = TERMynal_pfdcm;
TERMynal_pfdcm.prototype.response_print = function(pfresponse) {
    let str_help = `

        pfdcm - specific TERMynal response handling.

    `;
    this.contents               = pfresponse;
    let l_termynal              = this.to_termynalResponseGenerate(pfresponse,
                                        'style = "padding: 0px 0px;"');
    this.tprintf(l_termynal);
}

/////////
///////// TERMynal_PACS calling object with some specializations
/////////

function TERMynal_PACS(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        A PACS "specialized" class of the base TERMynal.

    `;

    TERMynal.call(this, str_DOMkey, DOMoutput, d_settings);
    this.currentStudyIndex              = 0;
    this.totalNumberOfStudies           = 0;
}

TERMynal_PACS.prototype                 = Object.create(TERMynal.prototype);
TERMynal_PACS.prototype.constructor     = TERMynal_pfdcm;

TERMynal_PACS.prototype.pfresponseError_show    = function(pfresponse) {
    let str_help = `

        A simple method for reporting errors in the PACS interaction.

    `;

    let json_response   = pfresponse.json_response;
    let str_errorMsg    = json_response.msg;
    let str_suggest;

    this.clear([]);

    if(str_errorMsg == 'Invalid PACS specified.') {
        str_suggest     = "Please very PACS settings using the 'Config PACS' button";
    }

    l_termynal          = [
        '<span data-ty style="color:red;">An error was caught in the PACS interaction!</span>',
        '<span data-ty style="color:red;">Reported issue was:</span>',
        '<span data-ty style="color:yellow;">' + str_errorMsg + '</span>',
        '<span data-ty style="color:yellow;">' + str_suggest + '</span>',
    ];
    this.DOMoutput.innerHTML_listadd(this.str_DOMkey, l_termynal);
}


TERMynal_PACS.prototype.response_print          = function(pfresponse) {
    let str_help = `

        PACS - specific TERMynal response handling.

        The input <pfresponse> is typically the response from the remote query.
        However, for a response with many "hits", an integer can be passed 
        which denotes a specific "hit" in the response to display.

    `;

    switch(typeof(pfresponse)) {
        case    'undefined':    break;
        case    'object':       this.contents           = pfresponse;
                                break;
        case    'number':       this.currentStudyIndex  = pfresponse;
                                break;
    };
      
    if(!this.contents.json_response.status) {
        this.pfresponseError_show(this.contents);
    } else {
        this.clear([]);
        this.totalNumberOfStudies   = this.contents.json_response.query.report.rawText.length;
        const d_report              = this.contents.json_response.query.report.rawText[this.currentStudyIndex];


        let str_buttonStudy     = `<input type="button" value=" &#xf019 /StudyIndex/ " 
                                    style="padding: .1em .4em;" 
                                    class="pure-button 
                                           pure-button-primary 
                                           fa fa-download">
                                    `;

        let str_buttonSeries    = ` <input type="button" value=" &#xf019 /StudyIndex/./SeriesCount/ " 
                                    style="padding: .1em .4em;" 
                                    class="fa fa-download pure-button pure-button-primary">
                                    `;


        let l_navFirstNext = [
            ' First Study                                                    Next Study ',
        ];

        let l_navLastPrev = [
            ' Last Study                                                 Previous Study ',
        ];

        let l_position          = [
            ' Showing Study ' + (this.currentStudyIndex+1) + '/' + this.totalNumberOfStudies,
        ];

        b_trimLeftSpace         = false;
        let lt_navFirstNext     = this.sprintf(l_navFirstNext,  b_trimLeftSpace,  'style="color: lightgreen;"');
        let lt_navLastPrev      = this.sprintf(l_navLastPrev,   b_trimLeftSpace,  'style="color: lightgreen;"');
        let lt_position         = this.sprintf(l_position,      b_trimLeftSpace,  'style="color: fuchsia;"');
        let str_header          = d_report['header'];
        let str_body            = d_report['body'];
        str_body                = str_body.replace(/SeriesDescription/gi, '');
        let l_termynalHeader    = this.to_termynalResponseGenerate_fromText(str_header, false, 'style="color: yellow;"');
        let l_termynalBody      = this.to_termynalResponseGenerate_fromText(str_body,   true,  'style="color: cyan;"')

        let ltwrap_navFirstNext = this.lineBlock_packageAndStyle(lt_navFirstNext, '"', 
                                                                this.page.upArrow_inputButtonCreate()     + '</input>', 
                                                                this.page.rightArrow_inputButtonCreate()  + '</input>');
        let ltwrap_navLastPrev  = this.lineBlock_packageAndStyle(lt_navLastPrev, '"', 
                                                                this.page.downArrow_inputButtonCreate()     + '</input>', 
                                                                this.page.leftArrow_inputButtonCreate()  + '</input>');
        let ltwrap_position     = this.lineBlock_packageAndStyle(lt_position,    '"', str_buttonStudy,  '</input>');
        // let ltwrap_body         = this.lineBlock_packageAndStyle(l_termynalBody, 'justify-content:space-between"', str_buttonSeries);
        let ltwrap_body         = this.lineBlock_packageAndStyle(l_termynalBody, '"', str_buttonSeries + '&nbsp;');
        let ltwrap_header       = this.lineBlock_packageAndStyle(l_termynalHeader);

        this.tprintf(ltwrap_navFirstNext);
        this.tprintf(ltwrap_navLastPrev);
        this.tprintf(this.sprintf([' ']));
        this.tprintf(ltwrap_position);
        this.tprintf(this.sprintf([' ']));
        this.tprintf(ltwrap_header);
        this.tprintf(ltwrap_body);
    }
}

/////////
///////// A Page object that describes the HTML version elements from a 
///////// logical perspective.
/////////

function Page() {
    this.str_help = `
        The Page object defines/interacts with the html page.

        The page element strings are "defined" here, and letious
        DOM objects that can interact with these elements are also
        instantiated.
    `;

    this.b_jsonSyntaxHighlight      = true;
    document.onkeydown              = this.checkForArrowKeyPress;

    // Keys parsed from the URL
    this.l_urlParamsBasic = [   
        "pfdcm_IP", 
        "pfdcm_port", 
        "PACS_IP", 
        "PACS_port", 
        "PACS_AET", 
        "PACS_AEC", 
        "PACS_AETL",
        "PACS_name",
    ];

    // Specific PACS only keys
    this.l_PACSdetail   = [
        "PACS_IP", 
        "PACS_port", 
        "PACS_AET", 
        "PACS_AEC", 
        "PACS_AETL",
        "PACS_name"
    ];

    // DOM keys related to the pfdcm parts of the page
    this.l_pfdcm = [
        "pfdcm_get",
        "pfdcm_out",
        "data_pfdcm"
    ];

    // DOM keys related to the PACS Q/R parts of the page
    this.l_PACSQR   = [
        "PatientID",
        "PatientName",
        "AccessionNumber",
        "StudyDate",
        "Modality",
        "PerformedStationAETitle"
    ]

    // Concat the basic URL with the PACSQR since PACS fields can
    // be passed in the URL.
    this.l_urlParams    = this.l_urlParamsBasic.concat(this.l_PACSQR);

    // DOM keys related to termynal parts of the page
    this.l_termynal = [
        "termynal_pfdcm",
        "termynal_pacsRetrieveStatus",
        "termynal_pacs"
    ];

    // DOM obj elements --  Each object has a specific list of page key
    //                      elemnts that it process to provide page
    //                      access functionality
    this.DOMurl         = new DOM(this.l_urlParams);
    this.DOMpfdcm       = new DOM(this.l_pfdcm);
    this.DOMpacsdetail  = new DOM(this.l_PACSdetail);
    this.DOMpacsQR      = new DOM(this.l_PACSQR);
    this.DOMtermynal    = new DOM(this.l_termynal)

    this.PACS_TERMynal  = new TERMynal_PACS(
                                        "termynal_pacs",
                                        this.DOMtermynal, 
                                        {
                                            "rows":     50,
                                            "scheme":   "dark",
                                            "page":     this
                                        }
                                    );

    this.pfdcm_TERMynal = new TERMynal_pfdcm(
                                        "termynal_pfdcm", 
                                        this.DOMtermynal, 
                                        {
                                            "rows":     50,
                                            "scheme":   "dark",
                                            "page":     this
                                        }
    );

    this.pfdcm_TERMynal.screenClear_setDefault(
        [
            '<span data-ty="input" data-ty-prompt="#">Output from pfdcm appears here...</span>',
            '<span data-ty="input" data-ty-typeDelay="40" style="color: cyan;"data-ty-prompt="">...W A I T I N G...</span>'
        ]
    );

    this.PACS_TERMynal.screenClear_setDefault(
        [
            '<span data-ty="input" data-ty-prompt="#">Output from PACS appears here...</span>',
            '<span data-ty="input" data-ty-typeDelay="40" style="color: cyan;"data-ty-prompt="">...W A I T I N G...</span>'
        ]
    );

    // object that parses the URL
    this.url            = new URL(this.DOMurl);

    // object to allow a MSG object access to a DOM obj
    this.d_MSGtermynal   = {
        'element':  this.l_termynal,
        'dom':      this.DOMtermynal
    };

    let $accountDelete       = $('#delete-account'),
    $accountDeleteDialog     = $('#confirm-delete'),
    transition;

    $accountDelete.on('click', function() {
        console.log("here!!");
        $accountDeleteDialog[0].showModal();
        transition = setTimeout(function() {
            $accountDeleteDialog.addClass('dialog-scale');
        }, 0.5);
    });

    $('#cancel').on('click', function() {
        $accountDeleteDialog[0].close();
        $accountDeleteDialog.removeClass('dialog-scale');
        clearTimeout(transition);
    });

    $( "#helpInfo" ).dialog({
        autoOpen:       false,
        height:         520,
        width:          500,
        dialogClass:    'helpInfo-dialog'
    });
    
    $( "#help-opener" ).click(function() {
        $( "#helpInfo" ).dialog( "open" );
    });

    $( "#config_pfdcm" ).dialog({
        autoOpen:       false,
        height:         520,
        width:          800,
        dialogClass:    'config_pfdcm-dialog'
    });
    
    $( "#config_pfdcm-opener" ).click(function() {
        $( "#config_pfdcm" ).dialog( "open" );
    });

    $( "#config_PACS" ).dialog({
        autoOpen:       false,
        height:         220,
        width:          800,
        dialogClass:    'config_PACS-dialog'
    });
    
    $( "#config_PACS-opener" ).click(function() {
        $( "#config_PACS" ).dialog( "open" );
    });
}

Page.prototype = {
    constructor:    Page,

    FAinputButton_create:               function(astr_value, astr_fname, astr_baseSet = "fa") {
        let str_inputButton     = `<input type="button" value=" &#x` + astr_value + ` " 
                                    style="padding: .1em .4em;" 
                                    class=" pure-button 
                                            pure-button-primary 
                                            ` + astr_baseSet + ` ` + astr_baseSet + '-' + astr_fname + `">
                                  `;
        return(str_inputButton);
    },

    rightArrow_inputButtonCreate:       function() {
        return(this.FAinputButton_create("f35a", "arrow-alt-circle-right"));
    },

    rightArrow_process:                 function() {
        let str_help = `

            Process a right arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the next study in the returned QUERY.

        `;

        index = this.PACS_TERMynal.currentStudyIndex+1;
        if(index >= this.PACS_TERMynal.totalNumberOfStudies)
            index = 0;

        this.PACS_TERMynal.response_print(index);
    },

    leftArrow_inputButtonCreate:        function() {
        return(this.FAinputButton_create("f359", "arrow-alt-circle-left"));
    },

    leftArrow_process:                  function() {
        let str_help = `

            Process a left arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the previous study in the returned QUERY.

        `;

        index = this.PACS_TERMynal.currentStudyIndex-1;
        if(index < 0)
            index = this.PACS_TERMynal.totalNumberOfStudies-1;

        this.PACS_TERMynal.response_print(index);
    },

    upArrow_inputButtonCreate:          function() {
        return(this.FAinputButton_create("f35b", "arrow-alt-circle-up"));
    },

    upArrow_process:                    function() {
        let str_help = `

            Process an up arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the first study in the returned QUERY.

        `;

        index = 0;
        this.PACS_TERMynal.response_print(index);
    },

    downArrow_inputButtonCreate:        function() {
        return(this.FAinputButton_create("f358", "arrow-alt-circle-down"));
    },

    downArrow_process:                  function() {
        let str_help = `

            Process a down arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the very last study in the returned QUERY.

        `;

        index = this.PACS_TERMynal.totalNumberOfStudies-1;
        this.PACS_TERMynal.response_print(index);
    },

    checkForArrowKeyPress:          function(e) {
        let str_help = `

            The 'this' seems confused at this point. My guess is that
            since the event is defined on the "document" the 'this' 
            retains that identify when executing here. 

            Hence, we call the 'page' variable explicitly when resolving
            scope.

        `;

        e = e || window.event;

        if (e.keyCode == '38') {
            console.log('up arrow')
            page.upArrow_process();
            // up arrow
        }
        else if (e.keyCode == '40') {
            console.log('down arrow')
            page.downArrow_process();
            // down arrow
        }
        else if (e.keyCode == '37') {
            console.log('left arrow')
            page.leftArrow_process();
           // left arrow
        }
        else if (e.keyCode == '39') {
            console.log('right arrow')
            page.rightArrow_process();
        }
    },

    jsonSyntaxHightlight_toggle:    function() {
        let debug           = new Debug("Page.jsonSyntaxHighlight_toggle");
        debug.entering();
        let JSON_syntaxButton_DOM = document.getElementById("JSON_status");
        debug.vlog({message: 'before toggle: b_jsonSyntaxHighlight', let: this.b_jsonSyntaxHighlight});
        this.b_jsonSyntaxHighlight = !this.b_jsonSyntaxHighlight;
        debug.vlog({message: 'after  toggle: b_jsonSyntaxHighlight', let: this.b_jsonSyntaxHighlight});
        if(this.b_jsonSyntaxHighlight) {
            JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: ON';
            JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-on';
        }
        if(!this.b_jsonSyntaxHighlight) {
            JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: OFF';
            JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-on';
        }
        debug.leaving();
    },
    
    fields_populateFromURL: function() {
        let str_help = `
            Populate various fields on the page from URL args
        `;
        this.url.parse();
    }
}

// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------

// Page object
page        = new Page();

// communication object, which includes the page so that MSG results
// can be displayed.
post        = new REST(
                        {
                            'page':         page,
                            'VERB':         'POST',
                            'type':         'text',
                            'scheme':       'http',
                            'path':         '/api/v1/cmd/',
                            'clientAPI':    'Fetch'
                        }
                    );


// The whole document
$body                       = $("body");

// Some specific parts of the document -- in a proper design these would be members
// of a class. To indicate the more global scope, these are all prepended with an 'm'
// for 'member'. ** Not implemented yet **
// result_DOM                  = document.getElementById("result");
// PUSH_DOM                    = document.getElementById("dom_PUSH");
// URLsFromChRIS_DOM           = $('#URLsFromChRIS');
// d_URLsFromChRIS             = null;
// key_DOM                     = $('#key');
// // API call return strings
// APIcall                     = '';
// json_SRVresp              = '';
// // Some default/persistent URL select options.
// str_pathUp                  = '';
// str_allFeedsBase            = '';
// str_loginFile               = '';
// b_URLsBuild                 = true;
// b_jsonSyntaxHighlight       = true;
b_useFileDB_status          = true;
b_createNewDB_status        = false;
b_loginStatus               = false;
b_canPUSH                   = false;            // Toggles PUSH display
b_PUSHchoicesRendered       = false;
functionCallDepth           = 0;
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------


$(document).on({
    ajaxStart:  function() { $body.addClass("loading");  output(APIcall);  },
    ajaxStop:   function() { $body.removeClass("loading"); }
});


$(".onlythree").keyup(function () {    
    if (this.value.length == this.maxLength) {    
        $(this).next('.onlythree').focus();    
    }    
});

function useFileDB_toggle() {
    let debug           = new C_debug();
    debug.functionName  = "useFileDB_toggle";
    debug.entering();
    fileDB_status_DOM = document.getElementById("useFileDB_status");
    debug.vlog({message: 'before toggle: b_useFileDB_status', let: b_useFileDB_status});
    b_useFileDB_status = !b_useFileDB_status;
    debug.vlog({message: 'after  toggle: b_useFileDB_status', let: b_useFileDB_status});
    if(b_useFileDB_status) {
        fileDB_status_DOM.innerHTML     = 'Use file DB: ON';
        fileDB_status_DOM.className     = 'button-xsmall pure-button pure-button-primary button-useFileDB-on';
    }
    if(!b_useFileDB_status) {
        fileDB_status_DOM.innerHTML     = 'Use file DB: OFF';
        fileDB_status_DOM.className     = 'button-xsmall pure-button pure-button-primary button-useFileDB-off';
    }
    debug.leaving();
}

function createNewDB_toggle() {
    let debug           = new C_debug();
    debug.functionName  = "createNewDB_toggle";
    debug.entering();
    fileDB_status_DOM = document.getElementById("createNewDB_status");
    fileDB_label_DOM  = document.getElementById("createNewDB_feedsLabel");
    fileDB_feeds_DOM  = document.getElementById("createNewDB_feedsVal");
    debug.vlog({message: 'before toggle: b_createNewDB_status', let: b_createNewDB_status});
    b_createNewDB_status = !b_createNewDB_status;
    debug.vlog({message: 'after  toggle: b_createNewDB_status', let: b_createNewDB_status});
    if(b_createNewDB_status) {
        fileDB_status_DOM.innerHTML         = 'Create new DB: ON';
        fileDB_status_DOM.className         = 'button-xsmall pure-button pure-button-primary button-createNewDB-on';
        fileDB_label_DOM.style.visibility   = 'visible';
        fileDB_feeds_DOM.style.visibility   = 'visible';
    }
    if(!b_createNewDB_status) {
        fileDB_status_DOM.innerHTML         = 'Create new DB: OFF';
        fileDB_status_DOM.className         = 'button-xsmall pure-button pure-button-primary button-createNewDB-off';
        fileDB_label_DOM.style.visibility   = 'hidden';
        fileDB_feeds_DOM.style.visibility   = 'hidden';
    }
}

function loginStatus_toggle() {
    let debug           = new C_debug();
    debug.functionName  = "loginStatus_toggle";
    debug.entering();
    b_loginStatus   = !b_loginStatus;
    debug.vlog({message: 'b_loginStatus', let: b_loginStatus});
    if(b_loginStatus) {
        login();
    } else {
        logout();
    }
    debug.leaving();
}

function file_exist(str_filename) {
    let http = new XMLHttpRequest();
    http.open('HEAD', str_filename, false);
    http.send();
    return http.status!=404;
}

function loginStatus_show(ab_status) {
    let debug           = new C_debug();
    debug.functionName  = "loginStatus_show";
    debug.entering();
    loginStatus_DOM = document.getElementById("loginStatus");
    debug.vlog({message: 'ab_status', let: ab_status});
    b_loginStatus = ab_status;
    if(ab_status) {
        loginStatus_DOM.innerHTML           = 'login status: logged in';
        loginStatus_DOM.className           = 'button-xsmall button-loginStatus-loggedIn pure-button';
    } else {
        loginStatus_DOM.innerHTML           = 'login status: logged out';
        loginStatus_DOM.className           = 'button-xsmall button-loginStatus-loggedOut pure-button';
    }
    debug.leaving();
}

function loginStatus_fileTagGenerate() {
    serverAddress       = window.location.href;
    l_p = serverAddress.split('/');
    str_loginFile       = 'chris-login.json';
    l_p[l_p.length - 1] = str_loginFile;
    str_loginURLtag     = l_p.join('/');
}

function login() {
    d_APIcall = {
        'type':             'GET',
        'APIcallOverride':  '/v1/login?auth=user=chris,passwd=chris1234',
        'showOutput':       true,
        'data':             ''
    };
    REST_call(d_APIcall);
    loginStatus_show(file_exist(str_loginURLtag));
    b_URLsBuild = false;
}

function logout() {
    d_APIcall = {
        'type':             'GET',
        'APIcallOverride':  '/v1/logout?auth=user=chris,auth=ABCDEF',
        'showOutput':       true,
        'data':             ''
    };
    REST_call(d_APIcall);
    loginStatus_show(file_exist(str_loginURLtag));
    b_URLsBuild = false;
}



window.onload = function() {
    // loginStatus_fileTagGenerate();
    // loginStatus_show(file_exist(str_loginURLtag));

    // Parse the URL and populate relevant elements on the page
    page.fields_populateFromURL();
};

