if (typeof(Helpers) == 'undefined') {
        var Helpers = {};
};

var Helpers = 
{
        prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService)
				.getBranch("extensions.olip.").QueryInterface(Components.interfaces.nsIPrefBranch2),
        workWithFullUrl: this.prefs.getBoolPref("workWithFullURL"),
        	
        /* Show Settings Option To User */
        ShowSettings: function ()
        {
           alert("Showing Settings...") ; 
           var features = 'chrome,titlebar,toolbar,centerscreen,';
           window.openDialog('chrome://olip/content/olipSettings.xul', 'Olip Settings', features);
        },
               
        StartExternalApp: function ()
        {   
	    alert("Start External Application");
	    
            var url = this.getCurrentUrl();
	    
	    alert("url is [" + url + "]");
	    
            if ( null != url ) 
            {
                var currentUrl = null;
                if ( this.workWithFullUrl )
                {
                    currentUrl = serverName;	
                } else
                {	
                    var baseAddressWithOptionalPort = url[2] ;                     
                    var checkForPortMatchingRegEx = /(.*):(\d+)/ ; 
                    var _url = ""; 
                    var division = checkForPortMatchingRegEx.exec(baseAddressWithOptionalPort) ;                             
                    if ( null != division) 
                    {
                            var baseAdd = division[1]; 
                            var port = division[2] ;
                            _url = baseAdd;    
                    } else 
                    {
                            _url = baseAddressWithOptionalPort ;
                    }
		    currentUrl = _url;
                }
                this.OpenLinkInProgram(currentUrl) ; 
                return true;
            } else
            {
                this.ShowFFNotification("does not qualify as valid url...") ; 
                return false; 
            } 
        },
    
        getCurrentUrl: function()
        {
            var currentTabUrl = gBrowser.currentURI.spec;
	    alert("What is current tab url " + currentTabUrl + " shall i return full url " + workWithFullUrl);
	    
            if (! this.workWithFullUrl)
            {
                currentTabUrl = this.getFilteredCurrentTabUrl(currentTabUrl);
            }
	    alert("returning ... [" + currentTabUrl + "]");
            return currentTabUrl;
        },
        
        /*
           Copy current link to clipboard but copy till the domain part, Dont copy options given after the main URL.
           E.g. if user is on http://www.helpme.com/topic=life then below fucntion will only copy "www.helpme.com" 
        */
        CopyLinkToClipboard: function()
        {
            var url = this.getFilteredCurrentTabUrl() ;
            if ( null != url ) 
            {                  
                const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper) ;
                gClipboardHelper.copyString(url[2]);
            } else
            {
                this.ShowFFNotification("OLIP Error : Link could not be copied to clipboard!") ; 
            }
            
            return true; 
        },
        
        /*
            Actually launch the application on user`s machine! It tries to catch the error using try .. catch block.
        */      
        OpenLinkInProgram: function(url)
        {            
            var process = Components.classes["@mozilla.org/process/util;1"]
                            .createInstance(Components.interfaces.nsIProcess);
    
            var file = Components.classes["@mozilla.org/file/local;1"]
                            .createInstance(Components.interfaces.nsILocalFile);

            var extApp = this.GetExternalAppFromPrefs();
	    
	    alert("going to open [" + url + "] in this app [" + extApp + "]");
            file.initWithPath(extApp);
            try
            {
                    //alert("Ext app " + extApp);
                    process.init(file) ; 
            } catch (err)
            {
                    this.ShowAppLaunchErrorMessage(err);
                    return true;
            }
            var args = ["load", url];
            
            try
            {
                process.runAsync(args, args.length);
            } catch (err)
            {       
                this.ShowAppLaunchErrorMessage(err);
            }
            return true ; 
        },
        
        /* Display error message if extenal file being configured to launch does not exist! */
        ShowAppLaunchErrorMessage: function(err)
        {
                var errMsg = "Please check if external application exist!!\n\n" ; 
                errMsg += "Error Description :" + err.message + "\n\n" ;
                this.ShowPopupMessage(errMsg) ; 
        },
        
        /* Show regular alert messaage */
        ShowPopupMessage: function(msg)
        {
            alert(msg);
            return true ;
        },
        
        /* 
           Show Firefox pop-up blocked message 
           TODO: User  should be able to selecte which kind of message user would like to see! alert or pop-up blocker
        */
        ShowFFNotification: function(msg)
        {
            var nb = gBrowser.getNotificationBox();
            var n = nb.getNotificationWithValue('popup-blocked');
            if(n) 
            {
                    n.label = msg;
            } else 
            {
                    var buttons = [{
                            label: 'Ok',
                            accessKey: 'B',
                            popup: 'blockedPopupOptions',
                            callback: null
                    }];
    
                    const priority = nb.PRIORITY_WARNING_LOW;
                    nb.appendNotification(msg, 'popup-blocked',
                    'chrome://browser/skin/Info.png',
                    priority, buttons);
            }
        },
        
        /*
            Get Current Tab URL   
        */
        GetCurrentUrl: function()
        {
            var currentTabUrl = gBrowser.currentURI.spec ; 
            return currentTabUrl ; 
        },

        /*
            Parse the URL to get till domain part only. Ignore all other options
                TODO: Modify regext, so that user can specify their own regex
                TODO: Only limited to http(s) add (s)ftp as well
        */
        getFilteredCurrentTabUrl: function(url)
        {
            // var returnFullURL = Olip.Common.olipPrefs.getBoolPref("workWithFullURL");            
            var currentURL = url;
            alert("workWithFullUrl [" + workWithFullUrl +"]");
            
            if ( this.workWithFullUrl )
            {
                alert("Inside Return Full URL");
                return currentURL;                        
            }
            /* Get Regex from Options */
            var currentTabUrl = currentURL ; 
            // var urlRegEx = /^htt(p|ps):\/\/(.*?)\//;
            var urlRegEx = this.prefs.getCharPref("olipURLFilter");
            alert(Olip.Common.olipPrefs.getCharPref("olipURLFilter"))
            return currentTabUrl.match(urlRegEx); 
        },
        
        /*
            Settings menu, used to select the executable on users machine
        */
        GetExternalAppFromPrefs: function()
        {
		alert("Insize get external app");
                var extAppLocation = this.prefs.getCharPref("location");
                var noAppMsg = "Please Select External Application..." ;
                var validExts = /.*\.(exe|bat|vbe|cmd|sh|ksh|pl|py|rb)$/ ;
                if ( extAppLocation.match(noAppMsg) )
                {
                    var errMsg = "OLIP Ext: External Appplication Not Selected! Please set it first : Tools -> Olip Menu -> Options -> General -> External Application"; 
                    this.ShowFFNotification(errMsg);
                    return false;
                } else if ( ! extAppLocation.match(validExts))
                {
                    var errMsg = "External Application with unsupported extension detected! Valid extensions : exe|bat|vbe|com)|sh|ksh|pl|py|rb" ;
                    this.ShowFFNotification(errMsg) ;
                    return false;
                } else 
                {
                    return extAppLocation ; 
                }
        }	
}