"use strict";

var tabs = {};
var last_active_tab_id = 0;

//listen to the content script
browser.runtime.onConnect.addListener(function( port ){
	
	tabs[ port.sender.tab.id ] = {"tab": port.sender.tab, "port": port };

//console.log( port.sender.tab.id );
	port.onDisconnect.addListener( function( port ) {
		delete tabs[ port.sender.tab.id ];
	});
	
	port.onMessage.addListener(function(message){
		var data = JSON.parse( message );
		console.log( data.command );
		
		if ( data.command == "get" ) {
		
			var s = browser.storage.local.get();
			
			s.then(function(r){
				if ( typeof r[ data.url ] != "undefined" ) {
					port.postMessage( JSON.stringify( r[ data.url ] ) );
				} else  {
					port.postMessage("failed");
				}
			});


		} else if ( data.command == "set" ) {
			var save_data = {};

			save_data[ data.url ] = data.data;
			var s = browser.storage.local.set( save_data );
			s.then(function(){}, function(){console.log("error saving");});
		}
	});
});

//send to the content script
browser.commands.onCommand.addListener(function(command) {

		browser.tabs.query({ active: true, currentWindow: true }).then(scopetabs => {
			let currentTab = scopetabs[0]; // The currently focused tab
			///console.log("Current Tab ID: ", currentTab.id);
			//console.log(tabs);

			if ( tabs[ currentTab.id  ] ) {
				if ( command == "form-fill-save" ) {
					tabs[ currentTab.id ].port.postMessage({command: command});
				}
				if ( command == "form-fill-restore" ) {
					tabs[ currentTab.id ].port.postMessage({command: command});
				}	
			}

		});

});



function handleActivated(activeInfo) {
	last_active_tab_id = activeInfo.tabId;
}
browser.tabs.onActivated.addListener(handleActivated);
