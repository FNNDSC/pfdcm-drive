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
    d.var               var         variable to print

    */

    this.functionName   = '<void>';
    this.message        = '<void>';
    this.var            = null;
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
        if (typeof (d.var) != 'undefined')
            this.var = d.var;
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
        if (typeof (this.var) === 'object') {
            console.log(
                this.indent()               + 
                'In ' + this.functionName   + 
                ': ' + d.message + ' = '
            );
            console.log(d.var);
        } else
            console.log(
                this.indent()               + 
                'In ' + this.functionName   + 
                ': ' + d.message    + ' = ' + d.var);
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
 
    this.response       = response;
    this.str_response   = '';
    this.json_response  = {};

    this.response_typeParse(response);

};   

PFResponse.prototype = {
    constructor:    PFResponse,

    response_typeParse: function(response) {
        switch(typeof(response)) {
            case    'undefined':
                break;
            case    'string':
                this.str_response   = response;
                break;
            case    'object':
                this.json_response  = response;
        };
    },

    set:        function(response) {
        this.response_typeParse(response);
    },

    str_get:    function() {
        return(this.str_response);
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
    construct that the service understands) and also the idiosyncracies
    of the styling and structure of the DOM so as to best display results.

    As such there is an implicit coupling between this object and the 
    syntax of the remote server as well as the named elements in the DOM.
    `;

    // parameters governing the message comms
    this.d_comms            = d_comms;

    // the page we're acting within
    this.page               = d_comms['page'];

    // info on this *specific* message
    this.payload            = '';
    this.str_schemeAuthPath = '';

    // Response and links to the page components with which to 
    // interact
    this.pfresponse         = new PFResponse();
    this.DOMoutput          = null;
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

    syntaxHighlight:            function(json) {
        var str_help = `
            Convert an input string to colorized html string
        `;
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
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

    syntaxHighlight_termynal:   function(json) {
        var str_help = `
            Convert an input string to colorized html string suitable
            for termynal. Note the return from this function still needs to
            split into a list!
        `;
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
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
            return '<span data-ty class="' + cls + '">' + match + '</span>';
        });
    },

    hello:                      function() {
        str_help = `
        Return the JSON payload for a 'hello' message.
        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pfdcm';
        this.DOMoutput          = this.d_comms['MSGdom']['dom'];
        var d_msg = {
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
        this.DOMoutput          = this.d_comms['MSGdom']['dom'];
        var d_msg = {
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
        this.DOMoutput          = this.d_comms['MSGdom']['dom'];
        d_PACSinfo              = {
                'IP':               this.page.DOMpacsdetail.get('PACS_IP'), 
                'aetitle':          this.page.DOMpacsdetail.get('PACS_AET'), 
                'calledaetitle':    this.page.DOMpacsdetail.get('PACS_AEC'), 
                'port':             this.page.DOMpacsdetail.get('PACS_port') 
        };

        var str_serviceName     = this.page.DOMpacsdetail.get('PACS_name');

        d_set   = {
            [str_serviceName]: d_PACSinfo
        };

        var d_msg = {
            "action": "internalctl",
            "meta": {
                "var":      "/service",
                "set":      d_set
            }
        };
        return(d_msg);    
    },

    to_termynal:                function() {
        str_help = `
            Convert a multi-line response string to termynal
            friendly html. Each line of response string needs its
            own html tagged line of form:

                    <span data-ty>some string...</span>

        `;
        var l_header    = this.pfresponse.str_get().split('\r');

        // The 4th element of l_lines contains the actual
        // JSON return payload. We need to split on '\n'
        // on that list element
        var l_body                      = l_header[4].split('\n');
        this.pfresponse.json_response   = JSON.parse(l_header[4]);

        if(this.page.b_jsonSyntaxHighlight) {
            json_color                      = this.syntaxHighlight(l_header[4]);
            l_body                          = json_color.split('\n');
        } else {
            l_body                          = l_header[4].split('\n');
        }
    
        // Remove the last element (payload) of l_header...
        l_header.pop();

        // and concat the l_header with the l_body
        var l_lines     = l_header.concat(l_body);

        var l_termynal  = [];
        let counter = str => {
            return str.split('').reduce((total, letter) => {
              total[letter] ? total[letter]++ : total[letter] = 1;
              return total;
            }, {});
          };

        for(var str_line of l_lines) {
            let hist    = counter(str_line);
            if(' ' in hist) {
                let count   = hist[' '];
                let str_pad = new Array(count + 1).join('&nbsp;');
                if(this.page.b_jsonSyntaxHighlight) 
                    str_line = str_line.replace('">"', '">' + str_pad + '"');
                else
                    str_line = str_pad + str_line;
            }
            l_termynal.push("<span data-ty>" + str_line + "</span>");

        }
        return(l_termynal);
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
        var str = JSON.stringify(xhdr.responseText, null, 2);
        output(syntaxHighlight(xhdr.status));
        hdr = xhdr;
    },

    onBefore_callBack:      function () {
        var debug = new Debug("AJAX.onBefore_callback");
        debug.entering();
        debug.leaving();
    },

    onComplete_callBack:    function (jqXHR, textStatus) {
        var debug = new Debug("AJAX.onComplete_callBack");
        debug.entering();
        debug.leaving();
    },

    onSuccess_callBack:     function (SRVresp, textStatus, jqXHR) {
        /*
            This is an asynchronous function, so when a button in UI
            is hit triggering a REST call, internal state is not 
            updated until this function is called.
        */

        var debug = new Debug("AJAX.onSuccess_callback");
        debug.entering();

        debug.vlog({ 'message': 'SRVresp', var: SRVresp });

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
    var help = `
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
        var str_help = `
            Note that "weird" behaviour in comms is most often
            linked to parameter settings below. For example, sending
            any 'headers' seems to trigger an OPTIONS verb in the
            server irrespective of the 'method' value.
        `;

        var debug = new Debug("Fetch.postData");
        debug.entering();

        this.response  = await fetch(url, this.TXoptions);
        debug.leaving();
        return this.response.text();
    },

    checkFirstForErrorsInResponse:  function (response) {
        var debug = new Debug("Fetch.checkFirstForErrorsInResponse");
        debug.entering();

        debug.vlog({ 'message': '\nresponse', var: response });

        // Some parsing on 'reponse' for an error condition,
        // possibly reponse.ok if a Response object is passed
        if (!response.ok) {
            throw Error(response.statusText);
        }

        debug.leaving();
        return response;
    },

    handleReponse:  function (response) {
        var debug = new Debug("Fetch.handleResponse");
        debug.entering();

        console.log(response);
        this.TX.pfresponse.set(response);
        var l_termynal  = this.TX.to_termynal();
        this.TX.DOMoutput.innerHTML_listadd(this.TX.str_DOMkey, l_termynal);
        debug.leaving();

        return response;

    },

    handleErrorsInFetch:  async function (response) {
        var debug = new Debug("Fetch.handleErrorsInFetch");
        debug.entering();
        debug.vlog({ 'message': '\nresponse', var: response });

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
        var debug = new Debug("Fetch.fetch_retry");
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
        var str_help = `
        Say hello to pfdcm
        `;
        this.transmitAndProcess(this.msg.hello());
    },

    pfdcm_get:              function() {
        var str_help = `
        Say hello to pfdcm
        `;
        this.transmitAndProcess(this.msg.pfdcm_get());
    },

    pfdcm_set:              function() {
        var str_help = `
        Set pfdcm internals based on the contents of page input fields.
        `;
        this.transmitAndProcess(this.msg.pfdcm_set());
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
            }
        }
    },

    transmitAndProcess: function(payload) {
        this.clientAPI.transmitAndProcess(payload);
    },

}

function Page() {
    this.str_help = `
    The Page object defines/interacts with the html page.

    The page element strings are "defined" here, and various
    DOM objects that can interact with these elements are also
    instantiated.
    `;

    this.b_jsonSyntaxHighlight      = true;


    // DOM keys grouped logically
    this.l_urlParams = [   
        "pfdcm_IP", 
        "pfdcm_port", 
        "PACS_IP", 
        "PACS_port", 
        "PACS_AET", 
        "PACS_AEC", 
        "PACS_AETL",
        "PACS_name"
    ];

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

    // DOM keys related to termynal parts of the page
    this.l_termynal = [
        "termynal_pfdcm",
        "termynal_pacs"
    ];

    // DOM obj elements --  built off keys and providing page
    //                      access functionality
    this.DOMurl         = new DOM(this.l_urlParams);
    this.DOMpfdcm       = new DOM(this.l_pfdcm);
    this.DOMpacsdetail  = new DOM(this.l_PACSdetail);
    this.DOMtermynal    = new DOM(this.l_termynal)

    this.url            = new URL(this.DOMurl);
    // object to allow a MSG object access to a DOM obj
    this.d_MSGtermynal   = {
        'element':  this.l_termynal,
        'dom':      this.DOMtermynal
    };

}

Page.prototype = {
    constructor:    Page,

    jsonSyntaxHightlight_toggle:    function() {
        var debug           = new Debug("Page.jsonSyntaxHighlight_toggle");
        debug.entering();
        var JSON_syntaxButton_DOM = document.getElementById("JSON_status");
        debug.vlog({message: 'before toggle: b_jsonSyntaxHighlight', var: this.b_jsonSyntaxHighlight});
        this.b_jsonSyntaxHighlight = !this.b_jsonSyntaxHighlight;
        debug.vlog({message: 'after  toggle: b_jsonSyntaxHighlight', var: this.b_jsonSyntaxHighlight});
        if(this.b_jsonSyntaxHighlight) {
            JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: ON';
            JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-on';
        }
        if(!this.b_jsonSyntaxHighlight) {
            JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: OFF';
            JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-off';
        }
        debug.leaving();
    },
    
    termynal_clear:         function(element) {
        var str_help = `
        "clear" an output div element on the page.
        `;
        var l_line = ['<span data-ty="input" data-ty-prompt="#">Output from pfdcm appears here...</span>'];
        this.DOMtermynal.innerHTML_listset(element, l_line);
    },

    fields_populateFromURL: function() {
        var str_help = `
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
                            'clientAPI':    'Fetch',
                            'MSGdom':       page.d_MSGtermynal
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

$( "#helpInfo" ).dialog({
    autoOpen:       false,
    height:         520,
    width:          500,
    dialogClass:    'helpInfo-dialog'
});

$( "#opener" ).click(function() {
    $( "#helpInfo" ).dialog( "open" );
});

$(".onlythree").keyup(function () {    
    if (this.value.length == this.maxLength) {    
        $(this).next('.onlythree').focus();    
    }    
});

// function jsonSyntaxHightlight_toggle() {
//     var debug           = new C_debug();
//     debug.functionName  = "jsonSyntaxHighlight_toggle";
//     debug.entering();
//     JSON_syntaxButton_DOM = document.getElementById("JSON_status");
//     debug.vlog({message: 'before toggle: b_jsonSyntaxHighlight', var: b_jsonSyntaxHighlight});
//     b_jsonSyntaxHighlight = !b_jsonSyntaxHighlight;
//     debug.vlog({message: 'after  toggle: b_jsonSyntaxHighlight', var: b_jsonSyntaxHighlight});
//     if(b_jsonSyntaxHighlight) {
//         JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: ON';
//         JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-on';
//     }
//     if(!b_jsonSyntaxHighlight) {
//         JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: OFF';
//         JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-off';
//     }
//     debug.leaving();
// }

function useFileDB_toggle() {
    var debug           = new C_debug();
    debug.functionName  = "useFileDB_toggle";
    debug.entering();
    fileDB_status_DOM = document.getElementById("useFileDB_status");
    debug.vlog({message: 'before toggle: b_useFileDB_status', var: b_useFileDB_status});
    b_useFileDB_status = !b_useFileDB_status;
    debug.vlog({message: 'after  toggle: b_useFileDB_status', var: b_useFileDB_status});
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
    var debug           = new C_debug();
    debug.functionName  = "createNewDB_toggle";
    debug.entering();
    fileDB_status_DOM = document.getElementById("createNewDB_status");
    fileDB_label_DOM  = document.getElementById("createNewDB_feedsLabel");
    fileDB_feeds_DOM  = document.getElementById("createNewDB_feedsVal");
    debug.vlog({message: 'before toggle: b_createNewDB_status', var: b_createNewDB_status});
    b_createNewDB_status = !b_createNewDB_status;
    debug.vlog({message: 'after  toggle: b_createNewDB_status', var: b_createNewDB_status});
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
    var debug           = new C_debug();
    debug.functionName  = "loginStatus_toggle";
    debug.entering();
    b_loginStatus   = !b_loginStatus;
    debug.vlog({message: 'b_loginStatus', var: b_loginStatus});
    if(b_loginStatus) {
        login();
    } else {
        logout();
    }
    debug.leaving();
}

function file_exist(str_filename) {
    var http = new XMLHttpRequest();
    http.open('HEAD', str_filename, false);
    http.send();
    return http.status!=404;
}

function loginStatus_show(ab_status) {
    var debug           = new C_debug();
    debug.functionName  = "loginStatus_show";
    debug.entering();
    loginStatus_DOM = document.getElementById("loginStatus");
    debug.vlog({message: 'ab_status', var: ab_status});
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

