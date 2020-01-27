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
/*
    This object provides a convenient abstraction
    for accessing named components of the DOM, removing
    the very tight coupling that might occur by referening
    DOM literals.
*/

function DOM(al_keylist) {
    this.l_DOM = al_keylist;
}

DOM.prototype = {
    constructor:    DOM,

    elements:   function() {
        return this.l_DOM;
    },

    get:    function(str_key) {
        if(this.l_DOM.includes(str_key)) {
            return $('#'+str_key).val()
        } else {
            return null;
        }
    },

    set:    function(str_key, str_val) {
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
/*
    This object parses the URL for parameters to set in the 
    dashboard.
*/

function URL(dom) {
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
///////// MSG object
/////////
/*
    This object generates messages to send to the remote 
    `pfdcm` server
*/

function MSG(d_comms) {
    // parameters governing the message comms in general
    this.d_comms            = d_comms;

    // this.str_VERB           = d_comms['VERB'];
    // this.scheme             = d_comms['scheme'];
    // this.str_path           = d_comms['path'];
    // this.type               = d_comms['type'];

    // info on this *specific* message
    this.payload            = '';
    this.str_schemeAuthPath = '';
}

MSG.prototype = {
    constructor:    MSG,

    APIschemeAuthPath_build:    function() {
        /*
        Return the first part of the API call, typically the
        http://<host>[:<IP>][/path]
        */
        return(this.d_comms['scheme']       + 
               '://'                        +
               DOMurl.get('pfdcm_IP')       +
               ':'                          +
               DOMurl.get('pfdcm_port')     +
               this.d_comms['path']);
    },

    hello:                      function() {
        /*
        Return the JSON payload for a 'hello' message.
        */

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        d_meta  = {
            "askAbout": "sysinfo",
            "echoBack": "greetings"
        };
        d_msg = {
            "action": "hello",
            "meta": {
                "askAbout": "sysinfo",
                "echoBack": "greetings"
            }
        };   
        return(d_msg);    
    }
}

/////////
///////// REST calling object
/////////

function AJAX(Msg) {
    this.help = `
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

    call: function (payload) {
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
    this.help = `
        The Fetch object specifies communication basics using
        the fetch(...) mechanism. 

        The passed Msg object contains the payload and comms
        parameters for transmission (hence TX), while returned
        data is captured in the Fetch object itself.
    `;
    this.SRVresp        = null;
    this.json_SRVresp   = null;
    this.TX             = Msg;
    this.fetchRetries   = 5;
}

Fetch.prototype = {
    constructor: Fetch,

    postData: async function (url = '', data = {}) {
        /*
        Note that "weird" behaviour in comms is most often
        linked to parameter settings below. For example, sending
        any 'headers' seems to trigger an OPTIONS verb in the
        server irrespective of the 'method' value.
        */

        // Default options are marked with *
        const response = await fetch(url, {
            method:         this.TX.d_comms['VERB'],    // *GET, POST, PUT, DELETE, etc.
            mode:           'cors',                     // no-cors, *cors, same-origin
            cache:          'no-cache',                 // *default, no-cache, reload, force-cache, only-if-cached
            credentials:    'same-origin',              // include, *same-origin, omit
            // headers: {
            //     // 'Content-Type': 'application/json'
            //     // 'Content-Type': 'application/x-www-form-urlencoded',
            // },
            redirect:       'follow',                   // manual, *follow, error
            referrerPolicy: 'no-referrer',              // no-referrer, *client
            // body data type must match "Content-Type" header
            body: JSON.stringify(data)
        });
        // return await response.json(); // parses JSON response into native JavaScript objects
        return await response.text(); // parses JSON response into native JavaScript objects
    },

    handleErrorsInResponse: function (response) {
        var debug = new Debug("Fetch.handleErrorsInResponse");
        debug.entering();
        // Some parsing on 'reponse' for an error condition,
        // possibly reponse.ok if a Response object is passed
        // if (!response.ok) {
        //     throw Error(response.statusText);
        // }
        debug.leaving();
        return response;
    },

    handleReponse: function (response) {
        var debug = new Debug("Fetch.handleResponse");
        debug.entering();

        console.log(response);

        debug.leaving();
    },

    handleErrorsInFetch: function (response) {
        var debug = new Debug("Fetch.handleErrorsInFetch");
        debug.entering();
        // Some parsing on 'reponse' for an error condition,
        // possibly reponse.ok if a Response object is passed
        // if (!response.ok) {
        //     throw Error(response.statusText);
        // }
        debug.vlog({ 'message': '\nresponse', var: response });
        debug.leaving();
        return response;
    },

    sleep:          function(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    },

    fetch_retry:    async (url, options, n) => {
        try {
            await sleep(500);
            return await fetch(url, options)
        } catch (err) {
            if (n === 1) throw err;
            return await this.fetch_retry(url, options, n - 1);
        }
    },

    // call:           function(payload) {
    //     options = {
    //         method:         this.TX.d_comms['VERB'],    // *GET, POST, PUT, DELETE, etc.
    //         mode:           'cors',                     // no-cors, *cors, same-origin
    //         cache:          'no-cache',                 // *default, no-cache, reload, force-cache, only-if-cached
    //         credentials:    'same-origin',              // include, *same-origin, omit
    //         redirect:       'follow',                   // manual, *follow, error
    //         referrerPolicy: 'no-referrer',              // no-referrer, *client
    //         // body data type must match "Content-Type" header
    //         body: JSON.stringify(payload)
    //     };
    //     url     = this.TX.str_schemeAuthPath;
    //     n       = 4;
    //     SRVresp = this.fetch_retry(url, options, n);
    // },

    call: function (payload) {
        this.postData(
            this.TX.str_schemeAuthPath,
            payload)
        .then(this.sleep(500))
        .then(this.handleErrorsInResponse)
        .then(this.handleReponse)
        .catch(this.handleErrorsInFetch);
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
    constructor:    REST,

    hello:                  function() {
        /*
        Say hello to pfdcm
        */
        this.call(this.msg.hello());
    },

    do:                     function(d_op) {
        if('operation' in d_op) {
            switch(d_op['operation']) {
                case 'hello':   this.hello();
            }
        }
    },

    call:                   function(payload) {
        this.clientAPI.call(payload);
    },

}

// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// Some "global" variables.

l_urlParams = [   
    "pfdcm_IP", 
    "pfdcm_port", 
    "PACS_IP", 
    "PACS_port", 
    "PACS_AET", 
    "PACS_AEC", 
    "PACS_AETL",
    "PACS_name"
];

DOMurl      = new DOM(l_urlParams);
url         = new URL(DOMurl);
post        = new REST( {
                            'VERB':         'POST',
                            'type':         'text',
                            'scheme':       'http',
                            'path':         '/api/v1/cmd/',
                            'clientAPI':    'Fetch'
                        })


// The whole document
$body                       = $("body");

// Some specific parts of the document -- in a proper design these would be members
// of a class. To indicate the more global scope, these are all prepended with an 'm'
// for 'member'. ** Not implemented yet **
result_DOM                  = document.getElementById("result");
PUSH_DOM                    = document.getElementById("dom_PUSH");
URLsFromChRIS_DOM           = $('#URLsFromChRIS');
d_URLsFromChRIS             = null;
key_DOM                     = $('#key');
// API call return strings
APIcall                     = '';
json_SRVresp              = '';
// Some default/persistent URL select options.
str_pathUp                  = '';
str_allFeedsBase            = '';
str_loginFile               = '';
b_URLsBuild                 = true;
b_jsonSyntaxHighlight       = true;
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

function jsonSyntaxHightlight_toggle() {
    var debug           = new C_debug();
    debug.functionName  = "jsonSyntaxHighlight_toggle";
    debug.entering();
    JSON_syntaxButton_DOM = document.getElementById("JSON_status");
    debug.vlog({message: 'before toggle: b_jsonSyntaxHighlight', var: b_jsonSyntaxHighlight});
    b_jsonSyntaxHighlight = !b_jsonSyntaxHighlight;
    debug.vlog({message: 'after  toggle: b_jsonSyntaxHighlight', var: b_jsonSyntaxHighlight});
    if(b_jsonSyntaxHighlight) {
        JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: ON';
        JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-on';
    }
    if(!b_jsonSyntaxHighlight) {
        JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: OFF';
        JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-off';
    }
    debug.leaving();
}

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
    loginStatus_fileTagGenerate();
    loginStatus_show(file_exist(str_loginURLtag));

    // Parse the URL and populate relevant elements on the page
    url.parse();
};


function sort_unique(arr) {
    // From: http://stackoverflow.com/questions/4833651/javascript-array-sort-and-unique
    arr = arr.sort(function (a, b) { return a*1 - b*1; });
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { // start loop at 1 as element 0 can never be a duplicate
        if (arr[i-1] !== arr[i]) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function URLsFromChRIS_build(json_SRVresp, a_URLsFromChRIS) {
    /*
    This function parses the URL component of the response to
    build a list of possible navigable links from this
    point in the data space.

    It is important to always initialize this structure with the
    ROOT paths, i.e. /Plugins and /Feeds

    ARGS

        json_SRVresp      json object the reponse from ChRIS

    OPTIONAL

        a_URLsFromChRIS     array       an override for the URLs
                                        returned from the remote
                                        server

    If the <a_URLsFromChRIS> is sent, then

    */
    var selectedIndex   = -1;
    var debug           = new C_debug();
    debug.functionName  = "URLsFromChRIS_build";
    debug.entering();

    var str_ROOT        = json_SRVresp.return.ROOT;

    URLsFromChRIS_DOM.empty();
    if(typeof(a_URLsFromChRIS)==='object') {
        d_URLsFromChRIS = a_URLsFromChRIS.slice();
    } else {
        d_URLsFromChRIS = json_SRVresp.return.URL_get.slice();
    }

    // Push the ROOT URLs
    d_URLsFromChRIS.push('Feeds/'   + key_DOM.val());
    d_URLsFromChRIS.push('Plugins/' + key_DOM.val());

    d_URLsFromChRIS = sort_unique(d_URLsFromChRIS);

    // Now, build a breadcrumb path back through the data space
    if (str_pathUp.length) {
        str_path    = json_SRVresp.return.path;
        debug.vlog({message: 'str_path', var: str_path});
        l_path      = str_path.split('/');
        // Get rid of the trailing '/' if it exists.
        if(!l_path[l_path.length-1].length) l_path.pop();
        for(var d=l_path.length-1; d>=0; d--) {
            l_breadCrumb    = l_path.slice(0, d+1);
            str_breadCrumb  = l_breadCrumb.join('/');
            str_pathUp      = str_ROOT + '/' + key_DOM.val() + '__' + str_breadCrumb;
            if (str_pathUp != str_ROOT + '/' + key_DOM.val() + '__') {
                if(d==l_path.length-1) {
                    selectedIndex = d_URLsFromChRIS.length;
                }
                d_URLsFromChRIS.push(str_pathUp);
            }
        }
    }
    // Now build actual html about the d_URLsFromChRIS
    $.each(d_URLsFromChRIS, function (key, val) {
        if (!str_pathUp.length) {
            str_allFeedsBase    = str_ROOT + '/' + key_DOM.val();
            str_pathUp          = str_allFeedsBase + '__' + json_SRVresp.return.path;
        }
        URLsFromChRIS_DOM.append(
                $('<option></option>').val(key).html(val)
        );
    });
    URLsFromChRIS_DOM.val(selectedIndex);
    debug.leaving()
}

function URLsFromChRIS_maxDepth() {
    /*
        This function returns the length of the maximum URL
        'depth' in the URL array.

        PRECONDITIONS

            The d_URLsFromChRIS array must exist and contain elements.

        POSTCONDITIONS

            The length of the max 'dirpath' is returned.
        */

    var debug           = new C_debug();
    debug.functionName  = "URLsFromChRIS_maxDepth";
    debug.entering();

    maxDepth            = 0;
    d_URLsFromChRIS.forEach(function(el) {
        depth           = el.split('/').length;
        if(depth>maxDepth)
                maxDepth    = depth;
    });
    debug.leaving();
    return maxDepth;
}

function URLsFromChRIS_findAtDepth(depth) {
    /*
        This function returns an array of all "hits" in the
        ChRIS URL space at tree depth <depth>.

        ARGS
        depth       int     the depth to find and return.

        PRECONDITIONS

        The d_URLsFromChRIS array must exist and contain elements.

        POSTCONDITIONS

        An array of hits at <depth> are returned.

        */

    var debug           = new C_debug();
    debug.functionName  = "URLsFromChRIS_findAtDepth";
    debug.entering();

    d_URLsFromChRISpruned   = [];
    pruneCount              = 0;
    d_URLsFromChRIS.forEach(function(el) {
        if((el.split('/').length) == depth) {
            d_URLsFromChRISpruned.push(el);
            pruneCount++;
        }
    });

    debug.leaving();
    return d_URLsFromChRISpruned;
}

function URLsFromChRIS_treePrune(depth) {
    /*
    This function removes from the dictionary of ChRIS URL
    responses any URLs that exceed the passed <depth>

    ARGS
        depth       int     entries deeper than <depth> are pruned.

    PRECONDITIONS

        The d_URLsFromChRIS array must exist and contain elements.

    POSTCONDITIONS

        The d_URLsFromChRIS array is modified by this function.

    */

    var debug           = new C_debug();
    debug.functionName  = "URLsFromChRIS_treePrune";
    debug.entering();

    d_URLsFromChRISpruned   = [];
    pruneCount              = 0;
    d_URLsFromChRIS.forEach(function(el) {
        if((el.split('/').length) <= depth) {
            d_URLsFromChRISpruned.push(el);
            pruneCount++;
        }
    });
    d_URLsFromChRIS         = d_URLsFromChRISpruned.slice();
    debug.leaving();
    return d_URLsFromChRIS;
}

function output(inp) {
    result_DOM.innerHTML = "<pre>" + inp + "</pre>";
}

function syntaxHighlight(json) {
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
}

function API_assemblePrefix() {
    /*
        Assembles the first part of the URL access string to the remote
        server, typically:

            http://<IP>[:<port>]
    */

    // Assemble the service address and port:
    var pfdcm_IP    = $('#pfdcm_IP').val()
    var pfdcm_port  = $('#pfdcm_port').val()
    var IP1	= $('#IP1').val();
    var IP2	= $('#IP2').val();
    var IP3	= $('#IP3').val();
    var IP4	= $('#IP4').val();
    var str_hostIP  = "http://" + pfdcm_IP;
    var str_FQhost  = str_hostIP + ":" + pfdcm_port;

    return(str_FQhost);

}

function API_msgAssemble(str_assembly, d_APICall) {
    /*
        Based on the <str_assembly>, creates one of several pre-canned
        JSON messages.
    */
   d_msg = {}
   switch(str_assembly) {
        case 'allGet': d_APICall['tx'] = {
                'payload': {
                    'action': 'internalctl',
                    'meta': {
                        'var':  '/',
                        'get':  'value'
                    }
                }
            }
       break;
   }
}

function API_assembleCore(d_APIcall) {
    /*
        Assembles the main URL call from various subcomponents.
    */
    var debug           = new C_debug();
    debug.functionName  = "API_assembleCore";
    debug.entering();
    debug.vlog({message: 'd_APIcall', var: d_APIcall});

    d_JSONtoSend = {
        'payload': {

        }
    }

    if( typeof(d_APIcall['APIcallOverride'])==='undefined' || typeof(d_APIcall['URL']) === 'string') {
        str_URLsFromChRIS_selected  = URLsFromChRIS_DOM.val();
        if(typeof(str_URLsFromChRIS_selected)==="object") {
            APIcall                 = '/'               +
                    $('#version').val()                 +
                    '/Feeds/'   + key_DOM.val()         +
                    "?" + $('#AUTH').val();
        } else {
            URLsFromChRIS_selected  = parseInt(str_URLsFromChRIS_selected);
            // Remember, the d_URLsFromChRIS has been appended to by the URLsFromChRIS_build() method.
            if(typeof(d_APIcall['URL'])==='undefined') {
                str_URL = d_URLsFromChRIS[URLsFromChRIS_selected];
            } else {
                str_URL = d_APIcall['URL'];
            }
            APIcall                 = '/' +
                    $('#version').val()  + '/'          +
                    str_URL                             +
                    "?" + $('#AUTH').val();
        }
    } else {
        APIcall = d_APIcall['APIcallOverride'];
    }
    debug.vlog({message: 'APIcall', var: APIcall})
    debug.leaving();
    return(APIcall);
}

function API_assembleSuffix() {
    /*
    Assembles the "suffix" call, typically things like DB access.
    */

    var APIsuffix   = "";
    DBpath_DOM          = document.getElementById("DB");
    DBpath              = $('#DB');

    if(b_createNewDB_status) {
        var feeds	= $('#createNewDB_feedsVal').val();
        APIsuffix   = "&createNewDB=" + feeds;
    }
    if(DBpath_DOM.value.length) {
        APIsuffix   = APIsuffix + "&DBpath="   + DBpath_DOM.value;
    }
    return(APIsuffix);
}

function API_assemble(d_APIcall) {
    /*
    Builds the API from prefix, core, suffix components.
    */
    str_APIcall = API_assemblePrefix()
                + API_assembleCore(d_APIcall)
                + API_assembleSuffix();

    return(str_APIcall);
}

/**
 * @return {boolean}
 */
function RESTobject_detected() {
    /*
    Determines if a REST object is in a delta region about
    the current focus in the server data space.

    The data location is defined by the pattern of URLs returned
    by the server, given a position in the data space.
    */

    var debug           = new C_debug();
    debug.functionName  = "RESTobject_detected";
    debug.entering();

    b_canPUSH   = false;
    debug.vlog({message: 'd_URLsFromChRIS', var: d_URLsFromChRIS});
    if(d_URLsFromChRIS != null) {
        debug.log({message: 'Processing d_URLsFromChRIS...'});
        d_URLsFromChRIS.filter(function (el) {
            debug.vlog({message: 'el', var: el});
            if (el.indexOf('REST') >= 0) {
                b_canPUSH   = true;
            }
        });
    }
    debug.vlog({message: 'b_canPUSH', var: b_canPUSH});
    debug.leaving();
    return b_canPUSH;
}

function callback_AJAX_beforeSend() {
    var debug = new C_debug();
    debug.functionName = "callback_AJAX_beforeSend";
    debug.entering();
    debug.leaving();
}

function callback_AJAX_complete(json_SRVresp, d_APIcall) {
    var debug = new C_debug();
    debug.functionName = "callback_AJAX_complete";
    debug.entering();

    debug.vlog({message: 'json_SRVresp', var: json_SRVresp});
    if(!json_SRVresp.status &&
        json_SRVresp.message == 'JSON error in clientParams') {
        debug.log({message: 'Retrying client call...'});
        debug.vlog({message: 'd_APIcall', var: d_APIcall});
        d_APIcall['branchOnREST']   = true;
        REST_call(d_APIcall);
    }
    debug.leaving();
}

function callback_AJAX_success(SRVresp, d_APIcall) {
    /*
    This is an asynchronous function, so when you hit a button in REST_call, state of
    available URLs etc are NOT updated until this function is called.
    */


    var debug           = new C_debug();
    debug.functionName  = "callback_AJAX_success";
    debug.entering();

    SRVresp           = JSON.stringify(SRVresp, null, 2);
    json_SRVresp      = JSON.parse(SRVresp);

    debug.vlog({'message': 'json_SRVresp', var: json_SRVresp});
    debug.vlog({'message': 'd_APIcall', var: d_APIcall});
    if(!b_URLsBuild)
        b_URLsBuild = true;
    else
        if(b_loginStatus) {
            if(typeof(  json_SRVresp.return['refreshREST'])==='boolean' &&
                        json_SRVresp.return['refreshREST']) {
                PUSH_DOM.style.display = "none";
                PUSH_DOM.innerHTML = "";
                b_PUSHchoicesRendered = false;
            }
            URLsFromChRIS_build(json_SRVresp);
            if(d_APIcall['branchOnREST']) {
                debug.log({message: 'About to call PUSH_choicesGET()...'});
                if(RESTobject_detected()) PUSH_choicesGET();
            }
            if(d_APIcall['choicesParse']) {
                PUSH_choicesParse();
            }
    }
    debug.vlog({message: 'showOutput', var: d_APIcall.showOutput});
    if(d_APIcall['showOutput']) {
        if (b_jsonSyntaxHighlight)
            output(syntaxHighlight(SRVresp));
        else
            output((SRVresp));
        loginStatus_show(file_exist(str_loginURLtag));
    }
    if(RESTobject_detected()) {
        PUSH_DOM.style.display  = "block";
    } else {
        PUSH_DOM.style.display  = "none";
        PUSH_DOM.innerHTML      = "";
        b_PUSHchoicesRendered   = false;
    }
    debug.vlog({message: 'b_canPUSH',               var: b_canPUSH});
    debug.vlog({message: 'PUSH_DOM.style.display',  var: PUSH_DOM.style.display});
    debug.vlog({message: 'b_PUSHchoicesRendered',   var: b_PUSHchoicesRendered});
    debug.leaving();
}

function callback_AJAX_error(xhdr, textStatus, thrownError) {
    hdr                 = null;
    console.log('Some error was triggered.');
    console.log('textStatus         = ' +  textStatus);
    console.log('xhdr.statusText    = ' +  xhdr.statusText);
    console.log('xhdr.responseText  = ' +  xhdr.responseText);
    console.log('xhdr.status        = ' +  xhdr.status);
    console.log('thrownError        = ' +  thrownError);
    var str = JSON.stringify(xhdr.responseText, null, 2);
    output(syntaxHighlight(xhdr.status));
    hdr=xhdr;
}

function REST_call(d_APIcall) {
    /*
        The main entry point to calling the service. The specific arguments
        to pass to the back end service are typically parsed from the HTML
        content; however if <APIcallOverride> is defined, then this will be
        passed instead. This is useful for specific "canned" calls, i.e.
        the login and logout calls -- the login() and logout() functions
        above.

        ARGS

            d_APICall           context-specific dictionary defining some
                                operational behavior

        */
    var debug           = new C_debug();
    debug.functionName  = "REST_call";
    debug.cl();
    debug.entering();

    SRVresp           = null;

    loginStatus_fileTagGenerate();

    if(typeof(d_APIcall)==='undefined') {
        d_APIcall                   = {};
        d_APIcall['type']           = 'GET';
        d_APIcall['showOutput']     = true;
        d_APIcall['branchOnREST']   = true;
        d_APIcall['data']           = '';
    }

    APIcall             = API_assemble(d_APIcall);
    debug.vlog({message: 'APIcall',     var: APIcall} );
    debug.vlog({message: 'd_APIcall',   var: d_APIcall});

    $.ajax({
        type:           d_APIcall['type'],
        url:            APIcall,
//            contentType:    'application/json', /* If selected, sends OPTIONS! */
        crossDomain:    true,
        dataType:       'json',
        data:           d_APIcall['data'],
        beforeSend:     callback_AJAX_beforeSend,
        complete:       function() {
            callback_AJAX_complete(json_SRVresp, d_APIcall);
        },
        success:        function(SRVresp) {
                        callback_AJAX_success(SRVresp, d_APIcall);
        },
        error:          callback_AJAX_error
    });
    debug.leaving();
    debug.cl();
    return false; //stop the form from initially submitting
}

function PUSH_choicesGET(ab_branchOnREST) {
    /*

    SYNOPSIS

        This is a pre-cursor call. When the dataspace on the server has changed
        due to some REST event, this function does a hidden GET on the node of
        the dataspace tree that has changed so that the client (i.e. this
        code) has the updated state as returned from the server.

        Since this hidden call is itself another REST event, it merely sets
        a pattern of appropriate flags and calls the main REST handler. These
        flags in turn are processed by the success callback which will in turn
        dispatch the programming thread to PUSH_choicesParse() with the
        preconditional that the return payload from the client contains the
        updated information.

    */

    var debug           = new C_debug();
    debug.functionName  = "PUSH_choicesGET";
    debug.entering();

    // At this point, a prior call to d_APIcall has possibly selected
    // a "key" (like 'body'/'timestamp'). We need to set this hidden GET
    // to a URL one above the REST token in the dataspace.

    d_URLsAboveREST             = URLsFromChRIS_findAtDepth(URLsFromChRIS_maxDepth()-1);

    d_APIcall                   = {};
    d_APIcall['type']           = 'GET';
    d_APIcall['URL']            = d_URLsAboveREST[0],
    d_APIcall['showOutput']     = false;
    d_APIcall['branchOnREST']   = false;
    d_APIcall['data']           = '';
    d_APIcall['choicesParse']   = true;

    debug.vlog( {message: 'd_APIcall', var: d_APIcall} );

    REST_call(d_APIcall);
    debug.leaving();
}

function PUSH_choicesParse() {
    /*

    SYNOPSIS
            Build the dialog box for the PUSH choices, and populates data with
            information as returned by the appropriate GET call.

    PRECONDITIONS

        o A GET call on the "parent" dataspace dir to the REST token.

        */

    var debug           = new C_debug();
    debug.functionName  = "PUSH_choicesParse";
    debug.entering();

    d_choice = json_SRVresp.return.payload;

    debug.vlog( {message: 'd_choice', var: d_choice});
    debug.vlog( {message: 'd_choice.keys()', var: Object.keys(d_choice)});

    l_keysPayload   = Object.keys(d_choice);
    l_keysPayload.filter(function (el) {
        if (el != "meta") {
            d_container = d_choice[el];
            debug.vlog({message: 'd_container', var: d_container});
            if (!(typeof(d_container) === 'string')) {
                if(!(typeof(d_container.REST) === 'undefined')) {
                    if (typeof(d_container.REST.PUSH) === 'object') {
                        d_PUSH = d_container.REST.PUSH;
                        debug.vlog({message: 'REST options', var: d_PUSH});
                        PUSH_choicesBuild(d_PUSH, d_APIcall);
                    }
                }
            } else {
                PUSH_choicesBuild(d_PUSH, d_APIcall);
            }
        }
    });
    debug.leaving();
}

function PUSH_choicesBuild(d_PUSH, d_APIcall) {
    /*
    "Build" the actual PUSH choices dialog boxes, based on the passed dictionary.

    Dictionary typically has components like:

        {
            <nodeName1>: <nodeType>,
            <nodeName1>: <nodeType>
        }

    eg:

        {
            "body":         "file",
            "timestamp":    "file"
        }

    which is rendered as:

                                                        [run] [clear] [del]
        [PUSH <nodeName>] [<............. text input box .............>]

    */
    var debug           = new C_debug();
    debug.functionName  = "PUSH_choicesBuild";
    debug.entering();
    debug.vlog( {message: 'd_PUSH', var: d_PUSH});
    l_keys = Object.keys(d_PUSH);
    debug.vlog( {message: 'l_keys', var: l_keys});
    if(!b_PUSHchoicesRendered) {
        $("#dom_PUSH").empty();
        l_keys.forEach(function (key) {
            debug.vlog({message: 'key/type', var: [key, d_PUSH[key]]});
            str_element     = 'PUSH_' + key;

            // Get the contents for each push element
            l_URL           = json_SRVresp.return.URL_get;
            b_textarea_mk   = false;
            rows            = 5;
            l_URL.forEach(function (url) {
                if(url.indexOf(key) >= 0) {
                    str_pathToObject    = json_SRVresp.return.path;
                    str_endNode         = str_pathToObject.split('/').slice(-1)[0];
                    str_endNodeParent   = str_pathToObject.split('/').slice(-2, -1)[0];
                    debug.vlog({message: 'str_endNodeParent',   var: str_endNodeParent});
                    debug.vlog({message: 'str_endNode',         var: str_endNode});
                    str_contents        = '';
                    if(str_endNode == key) {
                        debug.vlog({message: 'typeof(json_SRVresp.return.payload[key])', var: typeof(json_SRVresp.return.payload[key])})
                        if(typeof(json_SRVresp.return.payload[key])==='string') {
                            debug.vlog({message: 'pathInObject -- return.payload + ', var: key});
                            str_contents = json_SRVresp.return.payload[key];
                        }
                    } else {
                        debug.vlog({message: 'typeof(json_SRVresp.return.payload[str_endNode][key])', var: typeof(json_SRVresp.return.payload[str_endNode][key])})
                        if(typeof(json_SRVresp.return.payload[str_endNode][key])==='string') {
                            debug.vlog({message: 'pathInObject -- return.payload.' + str_endNode + ' + ', var: key});
                            str_contents = json_SRVresp.return.payload[str_endNode][key];
                        }
                    }
                    debug.vlog({message: 'str_contents for ' + key, var: str_contents});
                    if(str_contents.length > 60) {
                        b_textarea_mk   = true;
                        rows            = str_contents.length / 60 + 1;
                    }
                    debug.vlog({message: 'str_contents.length: ' + str_contents.length + ',b_textarea_mk', var: b_textarea_mk});
                    debug.vlog({message: 'rows', var: rows});
                }
            });

            // Build the push element components
            str_innerHTML   = ' '   +
                '<div class="push_wrapper">' +
                    '<div style="width:20%;">' +
                        '<label>'       +
                            '<button onclick="return PUSH_choicesRead(\'' + key + '\', \'post\',    d_PUSH)" style="float: right;" class="pure-button pure-button-primary">PUSH ' + key + '</button>' +
                        '</label>' +'' +
                    '</div>' +
                    '<div style="width:80%;">'      +
                        '<span>'        +
                            '<button onclick="return PUSH_choicesRead(\'' + key + '\', \'del\',     d_PUSH)" style="float: right;" class="button-REST-delete pure-button pure-button-primary"><i class="fa fa-trash fa-1x"></i></button>' +
                            '<button onclick="return PUSH_choicesRead(\'' + key + '\', \'clear\',   d_PUSH)" style="float: right;" class="button-REST-clear pure-button pure-button-primary"><i class="fa fa-close fa-1x"></i></button>' +
                            '<button onclick="return PUSH_choicesRead(\'' + key + '\', \'run\',     d_PUSH)" style="float: right;" class="button-REST-run pure-button pure-button-primary"><i class="fa fa-gear fa-1x"></i></button>';
            if(b_textarea_mk) {
                str_innerHTML = str_innerHTML   +
                            ' <textarea rows="' + rows + '" style="width:760px;font-family:courier;float:left;" id="PUSH_' + key + '" name="PUSH_' + key + '" value=""></textarea><br>';
            } else {
                str_innerHTML = str_innerHTML   +
                            ' <input style="width:760px;font-family:courier;" id="PUSH_' + key + '" name="PUSH_' + key + '" value=""><br>';
            }
            str_innerHTML   = str_innerHTML     +
                        '</span><br/><br/>' +
                    '</div>' +
                '</div>';
            debug.vlog({message: 'str_innerHTML', var: str_innerHTML});
            $("#dom_PUSH").append(str_innerHTML);

            PUSH_choice_DOM         = document.getElementById(str_element);
            debug.vlog({message: 'json_SRVresp', var: json_SRVresp});

            // And not place the contents into the locations in the HTML elements.
            l_URL.forEach(function (url) {
                if(url.indexOf(key) >= 0) {
                    PUSH_choice_DOM.value = str_contents;
                }
            });
        });
        b_PUSHchoicesRendered   = true;
    }
    debug.vlog({message: 'd_APIcall', var: d_APIcall});
    debug.leaving();
}

function PUSH_choicesRead(key, action, d_PUSH) {
    /*
        Read the input field and execute the REST call.

        ARGS
        key        string           key to access DOM element
        type       string           type of PUSH
        d_PUSH     dictionary       the PUSH object that the server
                                    transmitted
        */
    var debug           = new C_debug();
    debug.functionName  = "PUSH_choicesRead";
    debug.entering();

    debug.vlog({message: 'key',     var: key});
    debug.vlog({message: 'action',  var: action});
    str_element         = 'PUSH_' + key;
    PUSH_choice_DOM     = document.getElementById(str_element);
    console.log(PUSH_choice_DOM);

    str_value           = PUSH_choice_DOM.value;
    debug.vlog({message: 'PUSH payload', var: str_value});

    str_RESTcallType    = VERB.value;
    VERB                = document.getElementById('VERB')
    debug.vlog({message: 'VERB.value', var: str_RESTcallType});

    if(action == 'del') {
        str_value               = ' ';
        PUSH_choice_DOM.value   = str_value;
    }

    d_data                                          = {};
    d_data[str_RESTcallType]                        = {};
    d_data[str_RESTcallType]['action']              = action;
    remoteNodeType                                  = d_PUSH[key];
    d_data[str_RESTcallType][remoteNodeType]        = {};
    d_data[str_RESTcallType][remoteNodeType][key]   = str_value;

    debug.vlog({message: 'd_data',      var: d_data});
    debug.vlog({message: 'd_APIcall',   var: d_APIcall});

    d_APIcall   = {
        'type':             str_RESTcallType,
        'URL':              d_URLsFromChRIS[URLsFromChRIS_selected] + '/' + key,
        'showOutput':       true,
        'data':             JSON.stringify(d_data),
        'action':           action,
        'branchOnREST':     true
    };

    debug.vlog({message: 'd_APIcall',   var: d_APIcall});

    debug.leaving();

    return REST_call(d_APIcall);
}


function C_debug(d) {
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

    if(!(typeof(d)==='undefined')) {
        this.functionName   = d.functionName;
        this.message        = d.message;
        this.var            = d.var;
    }

    this.cl  = function() {
        console.log(' ');
    };

    this.indent     = function() {
        str_indent  = '';
        for(i=0; i<this.tab; i++)
            str_indent = str_indent + '\t';
        return str_indent;
    };

    this.entering   = function() {
        functionCallDepth += 1;
        this.tab = functionCallDepth;
        console.log(this.indent() +  '--------> Entering ' + this.functionName + '...');
    };

    this.leaving    = function() {
        console.log(this.indent() +  'Leaving ' + this.functionName + ' --------> ');
        functionCallDepth -= 1;
    };

    this.vlog       = function(d) {
        if(typeof(d.functionName)!='undefined') this.functionName   = d.functionName;
        this.message        = d.message;
        this.var            = d.var;
        if(typeof(this.var)==='object') {
            console.log(this.indent() + 'In ' + this.functionName + ': ' + d.message + ' = ');
            console.log(d.var);
        } else
            console.log(this.indent() + 'In ' + this.functionName + ': ' + d.message + ' = ' + d.var);
    };

    this.log = function(d) {
        if(typeof(d.functionName)!='undefined') this.functionName   = d.functionName;
        this.message        = d.message;
        console.log(this.indent() + 'In ' + this.functionName + ': ' + d.message);
    };

}
