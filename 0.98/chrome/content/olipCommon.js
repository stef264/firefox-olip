if (typeof(Olip) == 'undefined') {
	var Olip = {};
};

Olip.Common = 
{
    olipPrefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService)
							 .getBranch("extensions.olip.").QueryInterface(Components.interfaces.nsIPrefBranch2) , 
   
    /* 	Show Settings Option To User */
    ShowSettings: function ()
	{
	   // alert("Showing Settings...") ; 
	   var features = 'chrome,titlebar,toolbar,centerscreen,';
	   window.openDialog('chrome://olip/content/olipSettings.xul', 'Olip Settings', features);
	},
	
	/*
	Disabled. Future change to update the UI depending upon user selection.
	
    AlertStart: function ()
    {
        var isEnabled = Olip.Common.olipPrefs.getBoolPref("isenabled") ;

        if(!isEnabled) 
		    return 	;

	    var extAppLocation = this.GetExternalAppFromPrefs(); 
    },
    */
	
	/* 
		Launch external application with the current URL! External application could be anything like simple script, bat file 
		For Safety, only exe|bat|vbe|com)|sh|ksh|pl|py|rb extensions are allowed!	
		
		Note: Final responsibility lies with USER which application (s)he chooses to launch!!
	*/
	
    StartExternalApp: function ()
    {
       var serverName = this.getFilteredCurrentTabUrl() ;	   
	   if ( null != serverName ) 
	   {
		   var baseAddressWithOptionalPort = serverName[2] ; 
		   
		   var checkForPortMatchingRegEx = /(.*):(\d+)/ ; 
		   var puttyUrl = ""; 
		   var division = checkForPortMatchingRegEx.exec(baseAddressWithOptionalPort) ; 
		   
		   //alert("What is division : ["  + division + "] Base Add : [" + baseAddressWithOptionalPort +"]") ;
		   
		   if ( null != division) 
		   {
		      var baseAdd = division[1]; 
              var port = division[2] ;
		      puttyUrl = baseAdd;    
		   } else 
		   {
		      puttyUrl = baseAddressWithOptionalPort ;
		   }
		   //alert(puttyUrl);
		   this.OpenLinkInProgram(puttyUrl) ; 
		   return true;
	   } else
	   {
	       this.ShowFFNotification("does not qualify as valid url...") ; 
		   return false; 
	   } 
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
		    this.AddToClipBoard(url[2]);
		} else
		{
		    this.ShowFFNotification("OLIP Error : Link could not be copied to clipboard!") ; 
		}
		
		return true; 
	},
	
    /* Copy Complete URL To Clipboard */
    CopyFullLinkToClipboard: function()
    {
        var url = this.GetCurrentUrl() ; 
		if ( null != url ) 
		{		   
            this.AddToClipBoard(url) ;  
		} else
		{
		    this.ShowFFNotification("OLIP Error : Link could not be copied to clipboard!") ; 
		}
		
		return true; 
    },
    
    /* Add Data to Clipboard */
    AddToClipBoard: function(data)
    {
        const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper) ;
		gClipboardHelper.copyString(data);
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

        var extApp = this.GetExternalAppFromPrefs() ;					 
		file.initWithPath(extApp);
		try {
	        process.init(file) ; 
		} catch (err)
		{
		    this.ShowAppLaunchErrorMessage(err);
			return ;
		}
	    var args = [url];
		
		try {
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
	getFilteredCurrentTabUrl: function()
	{
	    /* Get Regex from Options */
		var currentTabUrl = this.GetCurrentUrl() ; 
		var urlRegEx = /^htt(p|ps):\/\/(.*?)\//;
        return currentTabUrl.match(urlRegEx) ; 
	},

	/*
	    Settings menu, used to select the executable on users machine
	*/
	GetExternalAppFromPrefs: function()
	{
		var extAppLocation = Olip.Common.olipPrefs.getCharPref("location");
		var noAppMsg = "Please Select External Application..." ;
		var validExts = /.*\.(exe|bat|vbe|com|sh|ksh|pl|py|rb)$/ ;
		if ( extAppLocation.match(noAppMsg) )
		{
		    var errMsg = "OLIP Ext: External Appplication Not Selected! Please set it first : Tools -> Olip Menu -> Options -> General -> External Application"; 
			this.ShowFFNotification(errMsg);
		} else if ( ! extAppLocation.match(validExts))
		{
			var errMsg = "External Application with unsupported extension detected! Valid extensions : exe|bat|vbe|com)|sh|ksh|pl|py|rb" ;
			this.ShowFFNotification(errMsg) ; 
		} else 
		{
			return extAppLocation ; 
		}
	},

	/*
	    Plain old go to home page (Will Update when there is something to show)
	*/
	GotoHomePage: function()
	{
        var projUrl = 'http://code.google.com/p/olip' 
	    gBrowser.addTab(projUrl) ; 
        return true ;
	},

	/*
	    Future change
	*/	
	MatchWithFilter: function(url)
	{
		// Not Implemented
	}

    
};