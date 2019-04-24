
// Rename Layers.jsx
// Layer renaming script that uses keyword replacements.
// Version 1.1.

// https://github.com/joonaspaakko/Photoshop-Rename-Layers-Script

// Protip: You can unselect layers inside a group by double clicking the arrow
// next to the group while holding down Cmd on Mac and Ctrl on windows

/*
  ================
  Example scenario
  ================
  
  Current layer name is:
  Button1
  
  Renaming with this:
  {layer:name:lowercase}-{layer:width}x{layer:height}{doc:rulerunits}.png
  
  Would output this:
  button1-120x120px.png
*/

// ==========
// Changelog:
// ==========

// V.1.1.
// - Tested in Photoshop CC 2019
// - Minor code changes. Just made it a little cleaner in places... No difference in functionality.

// V.1.0.
// - First version
// - Tested in Photoshop CC 2019
// - Known "issue": Doesn't work with the background layer.
//   Background layer is always called "Background". It works just
//   fine if you turn the background layer into a normal layer first.

#target photoshop

if ( app.documents.length > 0 ) {
  app.activeDocument.suspendHistory("Rename Layers (script)", "renameLayers()");
}

function renameLayers() {

  var textFile = new File($.fileName);
  var textFilePath = textFile.parent + "/" + textFile.name.substring(0, textFile.name.lastIndexOf('.')) + ".jsx - Recent Renames.txt";
  
  var previousLayerNames = readFile( textFilePath );
  var dialogText = createDialog( previousLayerNames, textFilePath );
  
  if ( dialogText !== null ) {
    
    var selectedLayers = getSelectedLayers();
    var layersLength = selectedLayers.id.length;
		
    var ascendingNumber = layersLength;
    var descendingNumber = 0;
    
    for( var i=0; i < layersLength; i++ ) {
      var layer = selectedLayers.obj[i];
      var newName = replacements( dialogText, ascendingNumber, descendingNumber );
      var visibility = layer.visible;
      layer.name = newName;
      layer.visible = visibility;
      --ascendingNumber;
      ++descendingNumber;
    }
    
    buildSelectionWithIDs( selectedLayers.id );
    
  }
  
}

function replacements( string, ascendingNumber, descendingNumber ) {
  
  var r = [
    
    "{layer:name}",
    "{layer:name:lowercase}",
    "{layer:width}",
    "{layer:height}",
    
    "{doc:name}",
    "{doc:name:lowercase}",
    "{doc:width}",
    "{doc:height}",
    "{doc:rulerunits}", // So you can do like: "layer:width}x{layer:height}{doc:rulerunits", which would translate to something like 200x200mm
    
    "{year}",
    "{month}",   // No leading zero
    "{month:0}", // Leading Zero
    "{day}",     // No leading zero
    "{day:0}",   // Leading Zero
    
    "{n:0}",         // Ascending - incremental numbers - Start with 0
    "{n}", "{n:1}",  // Ascending - incremental numbers
    "{nn:0}",        // Descending - incremental numbers - Start with 0
    "{nn}", "{nn:1}" // Descending - incremental numbers
  ];
  
  for (var i = 0; i < r.length; i++) {
    if ( string.match( r[i] ) !== null ) {
      
      var v;
      switch ( r[i] ) {
        
        case "{doc:name}":
          v = app.activeDocument.name;
          break;
        case "{doc:name:lowercase}":
          v = app.activeDocument.name.toLowerCase();
          break;
          
        case "{doc:width}":
          v = parseInt( app.activeDocument.width.value, 10);
          break;
        case "{doc:height}":
          v = parseInt( app.activeDocument.height.value, 10);
          break;
				
        case "{doc:rulerunits}":
          var rulerUnits = app.preferences.rulerUnits.toString().split('.')[1].toLowerCase();
          if ( rulerUnits === 'percent' ) {
            rulerUnits = '%';
          }
          else if ( rulerUnits === 'pixels' ) {
            rulerUnits = 'px';
          }
          else if ( rulerUnits === 'points' ) {
            rulerUnits = 'pts';
          }
          v = rulerUnits;
          break;
        
        case "{layer:name}":
          v = app.activeDocument.activeLayer.name;
          break;
        case "{layer:name:lowercase}":
          v = app.activeDocument.activeLayer.name.toLowerCase();
          break;
          
        case "{layer:width}":
        case "{layer:height}":
          var bounds = app.activeDocument.activeLayer.bounds;
          var width = parseInt( bounds[2].value - bounds[0].value, 10);
          var height = parseInt( bounds[3].value - bounds[1].value, 10);
          v = r[i] === "layer:width" ? width : height;
          break;
        
				case "{year}":
						var date = new Date();
						var year = date.getFullYear();
						v = year;
					break;
          
				case "{month}":
						var date = new Date();
						var month = date.getMonth()+1;
						v = month;
					break;
					
				case "{month:0}":
						var date = new Date();
						var month = date.getMonth()+1;
						v = ("0" + month).slice(-2);
					break;
					
				case "{day}":
						var date = new Date();
						var day = date.getDate();
						v = day;
					break;
					
				case "{day:0}":
						var date = new Date();
						var day = date.getDate();
						v = ("0" + day).slice(-2);
					break;
        
        // 0,1,2
				case "{n:0}":
					v = ascendingNumber === '$' ? '$' + String.fromCharCode('0x2191') : ascendingNumber-1;
					break;
        // 1,2,3
        case "{n:1}":
        case "{n}":
          v = ascendingNumber === '$' ? '$' + String.fromCharCode('0x2191') : ascendingNumber;
          break;
          
        // 2,1,0
				case "{nn:0}":
					v = ascendingNumber === '$' ? '$' + String.fromCharCode('0x2193') : descendingNumber;
					break;
				// 3,2,1
        case "{nn:1}":
        case "{nn}":
          v = descendingNumber === '$' ? '$' + String.fromCharCode('0x2193') : descendingNumber+1;
          break;
      }
      string = string.split( r[i] ).join( v );
    }
  }
  
  return string;
  
}

// Builds selection from an array of IDs
function buildSelectionWithIDs( ids ) {
  for ( var i = 0; i < ids.length; i++ ) {
    selectLayerByID( ids[i], (i===0) ? false : "add" );
  }
}

// selectLayerByID( id ) - Selects a layer ignoring current selection.
// selectLayerByID( id, "add" ) - Adds the layer to the selection.
// selectLayerByID( id, "remove" ) - Removes the layers from the selection.
function selectLayerByID( id, action ) {
  function cTID(s) { return app.charIDToTypeID(s); };
  function sTID(s) { return app.stringIDToTypeID(s); };
  var ref = new ActionReference();
  ref.putIdentifier(cTID('Lyr '), id);
  var desc = new ActionDescriptor();
  desc.putReference(cTID('null'), ref);
  if ( action ) {
    desc.putEnumerated(
      sTID('selectionModifier'),
      sTID('selectionModifierType'),
      ( action === 'remove' ? sTID('removeFromSelection') : sTID('addToSelection') )
    );
  }
  desc.putBoolean(cTID('MkVs'), false);
  executeAction(cTID('slct'), desc, DialogModes.NO);
}

function getSelectedLayers() {
  function cTID(s) { return app.charIDToTypeID(s); };
  function sTID(s) { return app.stringIDToTypeID(s); };
  var ids = [];
  var objs = [];
  var ref = new ActionReference();
  ref.putEnumerated( cTID('Dcmn'), cTID('Ordn'), cTID('Trgt') );
  var desc = executeActionGet(ref);
  if ( desc.hasKey(sTID('targetLayers')) ) {
    desc = desc.getList( sTID( 'targetLayers' ));
    var c = desc.count;
    for ( var i=0; i<c; i++ ) {
      var n = 0;
      try { activeDocument.backgroundLayer; } catch(e) { n = 1; }
      var idx = desc.getReference( i ).getIndex()+n;
      toIdRef = new ActionReference();
      toIdRef.putProperty( cTID("Prpr") , cTID( "LyrI" ));
      toIdRef.putIndex( cTID( "Lyr " ), idx );
      var id = executeActionGet(toIdRef).getInteger( sTID( "layerID" ));
      ids.push( id );
      selectLayerByID( id );
      objs.push( app.activeDocument.activeLayer );
    }
  }
  return {id:ids, obj:objs};
}

function createDialog( previousLayerNames, textFilePath ) {

  /*
  Code for Import https://scriptui.joonas.me — (Triple click to select):
  {"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"varName":null,"text":"Rename Layers.jsx","preferredSize":[650,0],"margins":16,"orientation":"column","spacing":15,"alignChildren":["fill","top"]}},"item-1":{"id":1,"type":"EditText","parentId":141,"style":{"varName":"layerNameInput","text":"{layer:name} ","preferredSize":[390,0],"alignment":null,"helpTip":null}},"item-2":{"id":2,"type":"Group","parentId":0,"style":{"varName":null,"preferredSize":[0,0],"margins":21,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null}},"item-3":{"id":3,"type":"Button","parentId":141,"style":{"varName":"btnOk","text":"Rename","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-29":{"id":29,"type":"Group","parentId":80,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-32":{"id":32,"type":"StaticText","parentId":29,"style":{"varName":null,"text":"Document name","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-43":{"id":43,"type":"Group","parentId":80,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-45":{"id":45,"type":"StaticText","parentId":43,"style":{"varName":null,"text":"Document width","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-46":{"id":46,"type":"Group","parentId":80,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-48":{"id":48,"type":"StaticText","parentId":46,"style":{"varName":null,"text":"Document height","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-49":{"id":49,"type":"Group","parentId":80,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-51":{"id":51,"type":"StaticText","parentId":49,"style":{"varName":null,"text":"Rulerunits (px, mm, inches...)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-52":{"id":52,"type":"Group","parentId":81,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-54":{"id":54,"type":"StaticText","parentId":52,"style":{"varName":null,"text":"Current year","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-55":{"id":55,"type":"Group","parentId":81,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-57":{"id":57,"type":"StaticText","parentId":55,"style":{"varName":null,"text":"Current month with leading zero","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-58":{"id":58,"type":"Group","parentId":81,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-60":{"id":60,"type":"StaticText","parentId":58,"style":{"varName":null,"text":"Current month","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-61":{"id":61,"type":"Group","parentId":81,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-63":{"id":63,"type":"StaticText","parentId":61,"style":{"varName":null,"text":"Current day","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-64":{"id":64,"type":"Group","parentId":82,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-66":{"id":66,"type":"StaticText","parentId":64,"style":{"varName":null,"text":"Descending numbers starting with 1 (3,2,1)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-67":{"id":67,"type":"Group","parentId":81,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-69":{"id":69,"type":"StaticText","parentId":67,"style":{"varName":null,"text":"Current day width leading zero","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-70":{"id":70,"type":"Group","parentId":82,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-72":{"id":72,"type":"StaticText","parentId":70,"style":{"varName":null,"text":"Ascending numbers starting with 1 (1,2,3)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-73":{"id":73,"type":"Group","parentId":82,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-75":{"id":75,"type":"StaticText","parentId":73,"style":{"varName":null,"text":"Ascending numbers starting with 0 (0,1,2)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-76":{"id":76,"type":"Group","parentId":82,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-78":{"id":78,"type":"StaticText","parentId":76,"style":{"varName":null,"text":"Descending numbers starting with 0 (2,1,0)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-79":{"id":79,"type":"TabbedPanel","parentId":0,"style":{"varName":null,"preferredSize":[0,0],"margins":25,"alignment":null,"selection":111}},"item-80":{"id":80,"type":"Tab","parentId":79,"style":{"varName":"tabGeneral","text":"Document keywords","orientation":"column","spacing":3,"alignChildren":["fill","top"]}},"item-81":{"id":81,"type":"Tab","parentId":79,"style":{"varName":"tabDate","text":"Date keywords","orientation":"column","spacing":3,"alignChildren":["left","top"]}},"item-82":{"id":82,"type":"Tab","parentId":79,"style":{"varName":"tabNumber","text":"Number keywords","orientation":"column","spacing":3,"alignChildren":["left","top"]}},"item-85":{"id":85,"type":"EditText","parentId":29,"style":{"varName":null,"text":"{doc:name}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-89":{"id":89,"type":"EditText","parentId":43,"style":{"varName":null,"text":"{doc:width}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-90":{"id":90,"type":"EditText","parentId":46,"style":{"varName":null,"text":"{doc:height}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-91":{"id":91,"type":"EditText","parentId":49,"style":{"varName":null,"text":"{doc:rulerunits}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-92":{"id":92,"type":"EditText","parentId":52,"style":{"varName":null,"text":"{year}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-93":{"id":93,"type":"EditText","parentId":58,"style":{"varName":null,"text":"{month}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-94":{"id":94,"type":"EditText","parentId":55,"style":{"varName":null,"text":"{month:0}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-95":{"id":95,"type":"EditText","parentId":61,"style":{"varName":null,"text":"{day}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-96":{"id":96,"type":"EditText","parentId":67,"style":{"varName":null,"text":"{day:0}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-97":{"id":97,"type":"EditText","parentId":70,"style":{"varName":null,"text":"{n:1}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-98":{"id":98,"type":"EditText","parentId":73,"style":{"varName":null,"text":"{n:0}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-99":{"id":99,"type":"EditText","parentId":64,"style":{"varName":null,"text":"{nn:1}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-100":{"id":100,"type":"EditText","parentId":76,"style":{"varName":null,"text":"{nn:0}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-101":{"id":101,"type":"Group","parentId":80,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-102":{"id":102,"type":"EditText","parentId":101,"style":{"varName":null,"text":"{doc:name:lowercase}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-103":{"id":103,"type":"StaticText","parentId":101,"style":{"varName":null,"text":"Document name in lowercase","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-110":{"id":110,"type":"Panel","parentId":0,"style":{"varName":null,"text":"Recent renames","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":3,"alignChildren":["fill","top"],"alignment":null}},"item-111":{"id":111,"type":"Tab","parentId":79,"style":{"varName":"tabGeneral","text":"Layer keywords","orientation":"column","spacing":3,"alignChildren":["fill","top"]}},"item-129":{"id":129,"type":"Group","parentId":111,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-130":{"id":130,"type":"EditText","parentId":129,"style":{"varName":null,"text":"{layer:name}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-131":{"id":131,"type":"StaticText","parentId":129,"style":{"varName":null,"text":"Layer name","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-132":{"id":132,"type":"Group","parentId":111,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-133":{"id":133,"type":"EditText","parentId":132,"style":{"varName":null,"text":"{layer:name:lowercase}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-134":{"id":134,"type":"StaticText","parentId":132,"style":{"varName":null,"text":"Layer name in lowercase","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-135":{"id":135,"type":"Group","parentId":111,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-136":{"id":136,"type":"EditText","parentId":135,"style":{"varName":null,"text":"{layer:width}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-137":{"id":137,"type":"StaticText","parentId":135,"style":{"varName":null,"text":"Layer width","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-138":{"id":138,"type":"Group","parentId":111,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-139":{"id":139,"type":"EditText","parentId":138,"style":{"varName":null,"text":"{layer:height}","preferredSize":[155,0],"alignment":null,"helpTip":null}},"item-140":{"id":140,"type":"StaticText","parentId":138,"style":{"varName":null,"text":"Layer height","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-141":{"id":141,"type":"Group","parentId":2,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-143":{"id":143,"type":"StaticText","parentId":2,"style":{"varName":"previewText","text":"preview text","justify":"center","preferredSize":[575,0],"alignment":null,"helpTip":null}}},"order":[0,2,141,1,3,143,110,79,111,129,130,131,132,133,134,135,136,137,138,139,140,80,29,85,32,101,102,103,43,89,45,46,90,48,49,91,51,81,52,92,54,58,93,60,55,94,57,61,95,63,67,96,69,82,70,97,72,73,98,75,64,99,66,76,100,78],"activeId":143}
  */

  // DIALOG
  // ======
  var dialog = new Window("dialog");
      dialog.text = "Rename Layers.jsx";
      dialog.preferredSize.width = 650;
      dialog.orientation = "column";
      dialog.alignChildren = ["fill","top"];
      dialog.spacing = 15;
      dialog.margins = 16;

  // GROUP1
  // ======
  var group1 = dialog.add("group");
      group1.orientation = "column";
      group1.alignChildren = ["fill","top"];
      group1.spacing = 10;
      group1.margins = 21;

  // GROUP2
  // ======
  var group2 = group1.add("group");
      group2.orientation = "row";
      group2.alignChildren = ["center","center"];
      group2.spacing = 10;
      group2.margins = 0;

  var layerNameInput = group2.add("edittext");
      layerNameInput.text = "{layer:name}";
      layerNameInput.preferredSize.width = 390;

  var btnOk = group2.add("button", undefined, undefined, {name: 'ok'});
      btnOk.text = "Rename";
      btnOk.justify = "center";

  // GROUP1
  // ======
  var previewText = group1.add("statictext");
      previewText.text = "preview text";
      previewText.preferredSize.width = 575;
      previewText.justify = "center";

  // PANEL1
  // ======
  var panel1 = dialog.add("panel");
      panel1.text = "Recent renames";
      panel1.orientation = "column";
      panel1.alignChildren = ["fill","top"];
      panel1.spacing = 3;
      panel1.margins = 10;

  // TPANEL1
  // =======
  var tpanel1 = dialog.add("tabbedpanel");
      tpanel1.alignChildren = "fill";
      tpanel1.preferredSize.width = 618;
      tpanel1.margins = 0;

  // TABGENERAL
  // ==========
  var tabGeneral = tpanel1.add("tab");
      tabGeneral.text = "Layer keywords";
      tabGeneral.orientation = "column";
      tabGeneral.alignChildren = ["fill","top"];
      tabGeneral.spacing = 3;
      tabGeneral.margins = 25;

  // GROUP3
  // ======
  var group3 = tabGeneral.add("group");
      group3.orientation = "row";
      group3.alignChildren = ["left","center"];
      group3.spacing = 10;
      group3.margins = 0;

  var edittext1 = group3.add("edittext");
      edittext1.text = "{layer:name}";
      edittext1.preferredSize.width = 155;

  var statictext1 = group3.add("statictext");
      statictext1.text = "Layer name";

  // GROUP4
  // ======
  var group4 = tabGeneral.add("group");
      group4.orientation = "row";
      group4.alignChildren = ["left","center"];
      group4.spacing = 10;
      group4.margins = 0;

  var edittext2 = group4.add("edittext");
      edittext2.text = "{layer:name:lowercase}";
      edittext2.preferredSize.width = 155;

  var statictext2 = group4.add("statictext");
      statictext2.text = "Layer name in lowercase";

  // GROUP5
  // ======
  var group5 = tabGeneral.add("group");
      group5.orientation = "row";
      group5.alignChildren = ["left","center"];
      group5.spacing = 10;
      group5.margins = 0;

  var edittext3 = group5.add("edittext");
      edittext3.text = "{layer:width}";
      edittext3.preferredSize.width = 155;

  var statictext3 = group5.add("statictext");
      statictext3.text = "Layer width";

  // GROUP6
  // ======
  var group6 = tabGeneral.add("group");
      group6.orientation = "row";
      group6.alignChildren = ["left","center"];
      group6.spacing = 10;
      group6.margins = 0;

  var edittext4 = group6.add("edittext");
      edittext4.text = "{layer:height}";
      edittext4.preferredSize.width = 155;

  var statictext4 = group6.add("statictext");
      statictext4.text = "Layer height";

  // TABGENERAL1
  // ===========
  var tabGeneral1 = tpanel1.add("tab");
      tabGeneral1.text = "Document keywords";
      tabGeneral1.orientation = "column";
      tabGeneral1.alignChildren = ["fill","top"];
      tabGeneral1.spacing = 3;
      tabGeneral1.margins = 25;

  // GROUP7
  // ======
  var group7 = tabGeneral1.add("group");
      group7.orientation = "row";
      group7.alignChildren = ["left","center"];
      group7.spacing = 10;
      group7.margins = 0;

  var edittext5 = group7.add("edittext");
      edittext5.text = "{doc:name}";
      edittext5.preferredSize.width = 155;

  var statictext5 = group7.add("statictext");
      statictext5.text = "Document name";

  // GROUP8
  // ======
  var group8 = tabGeneral1.add("group");
      group8.orientation = "row";
      group8.alignChildren = ["left","center"];
      group8.spacing = 10;
      group8.margins = 0;

  var edittext6 = group8.add("edittext");
      edittext6.text = "{doc:name:lowercase}";
      edittext6.preferredSize.width = 155;

  var statictext6 = group8.add("statictext");
      statictext6.text = "Document name in lowercase";

  // GROUP9
  // ======
  var group9 = tabGeneral1.add("group");
      group9.orientation = "row";
      group9.alignChildren = ["left","center"];
      group9.spacing = 10;
      group9.margins = 0;

  var edittext7 = group9.add("edittext");
      edittext7.text = "{doc:width}";
      edittext7.preferredSize.width = 155;

  var statictext7 = group9.add("statictext");
      statictext7.text = "Document width";

  // GROUP10
  // =======
  var group10 = tabGeneral1.add("group");
      group10.orientation = "row";
      group10.alignChildren = ["left","center"];
      group10.spacing = 10;
      group10.margins = 0;

  var edittext8 = group10.add("edittext");
      edittext8.text = "{doc:height}";
      edittext8.preferredSize.width = 155;

  var statictext8 = group10.add("statictext");
      statictext8.text = "Document height";

  // GROUP11
  // =======
  var group11 = tabGeneral1.add("group");
      group11.orientation = "row";
      group11.alignChildren = ["left","center"];
      group11.spacing = 10;
      group11.margins = 0;

  var edittext9 = group11.add("edittext");
      edittext9.text = "{doc:rulerunits}";
      edittext9.preferredSize.width = 155;

  var statictext9 = group11.add("statictext");
      statictext9.text = "Rulerunits (px, mm, inches...)";

  // TABDATE
  // =======
  var tabDate = tpanel1.add("tab");
      tabDate.text = "Date keywords";
      tabDate.orientation = "column";
      tabDate.alignChildren = ["left","top"];
      tabDate.spacing = 3;
      tabDate.margins = 25;

  // GROUP12
  // =======
  var group12 = tabDate.add("group");
      group12.orientation = "row";
      group12.alignChildren = ["left","center"];
      group12.spacing = 10;
      group12.margins = 0;

  var edittext10 = group12.add("edittext");
      edittext10.text = "{year}";
      edittext10.preferredSize.width = 155;

  var statictext10 = group12.add("statictext");
      statictext10.text = "Current year";

  // GROUP13
  // =======
  var group13 = tabDate.add("group");
      group13.orientation = "row";
      group13.alignChildren = ["left","center"];
      group13.spacing = 10;
      group13.margins = 0;

  var edittext11 = group13.add("edittext");
      edittext11.text = "{month}";
      edittext11.preferredSize.width = 155;

  var statictext11 = group13.add("statictext");
      statictext11.text = "Current month";

  // GROUP14
  // =======
  var group14 = tabDate.add("group");
      group14.orientation = "row";
      group14.alignChildren = ["left","center"];
      group14.spacing = 10;
      group14.margins = 0;

  var edittext12 = group14.add("edittext");
      edittext12.text = "{month:0}";
      edittext12.preferredSize.width = 155;

  var statictext12 = group14.add("statictext");
      statictext12.text = "Current month with leading zero";

  // GROUP15
  // =======
  var group15 = tabDate.add("group");
      group15.orientation = "row";
      group15.alignChildren = ["left","center"];
      group15.spacing = 10;
      group15.margins = 0;

  var edittext13 = group15.add("edittext");
      edittext13.text = "{day}";
      edittext13.preferredSize.width = 155;

  var statictext13 = group15.add("statictext");
      statictext13.text = "Current day";

  // GROUP16
  // =======
  var group16 = tabDate.add("group");
      group16.orientation = "row";
      group16.alignChildren = ["left","center"];
      group16.spacing = 10;
      group16.margins = 0;

  var edittext14 = group16.add("edittext");
      edittext14.text = "{day:0}";
      edittext14.preferredSize.width = 155;

  var statictext14 = group16.add("statictext");
      statictext14.text = "Current day width leading zero";

  // TABNUMBER
  // =========
  var tabNumber = tpanel1.add("tab");
      tabNumber.text = "Number keywords";
      tabNumber.orientation = "column";
      tabNumber.alignChildren = ["left","top"];
      tabNumber.spacing = 3;
      tabNumber.margins = 25;

  // TPANEL1
  // =======
  tpanel1.selection = tabGeneral;

  // GROUP17
  // =======
  var group17 = tabNumber.add("group");
      group17.orientation = "row";
      group17.alignChildren = ["left","center"];
      group17.spacing = 10;
      group17.margins = 0;

  var edittext15 = group17.add("edittext");
      edittext15.text = "{n:1}";
      edittext15.preferredSize.width = 155;

  var statictext15 = group17.add("statictext");
      statictext15.text = "Ascending numbers starting with 1 (1,2,3)";

  // GROUP18
  // =======
  var group18 = tabNumber.add("group");
      group18.orientation = "row";
      group18.alignChildren = ["left","center"];
      group18.spacing = 10;
      group18.margins = 0;

  var edittext16 = group18.add("edittext");
      edittext16.text = "{n:0}";
      edittext16.preferredSize.width = 155;

  var statictext16 = group18.add("statictext");
      statictext16.text = "Ascending numbers starting with 0 (0,1,2)";

  // GROUP19
  // =======
  var group19 = tabNumber.add("group");
      group19.orientation = "row";
      group19.alignChildren = ["left","center"];
      group19.spacing = 10;
      group19.margins = 0;

  var edittext17 = group19.add("edittext");
      edittext17.text = "{nn:1}";
      edittext17.preferredSize.width = 155;

  var statictext17 = group19.add("statictext");
      statictext17.text = "Descending numbers starting with 1 (3,2,1)";

  // GROUP20
  // =======
  var group20 = tabNumber.add("group");
      group20.orientation = "row";
      group20.alignChildren = ["left","center"];
      group20.spacing = 10;
      group20.margins = 0;

  var edittext18 = group20.add("edittext");
      edittext18.text = "{nn:0}";
      edittext18.preferredSize.width = 155;

  var statictext18 = group20.add("statictext");
      statictext18.text = "Descending numbers starting with 0 (2,1,0)";


  // CUSTOMIZATION
  
  
  
  layerNameInput.onActivate = function() {
    dialogTextReplacement();
  };
  layerNameInput.onChanging = function() {
    dialogTextReplacement();
  };
  
  function dialogTextReplacement() {
    var ascendingNumber = '$';
    var descendingNumber = '$';
    var newName = replacements( layerNameInput.text, ascendingNumber, descendingNumber );
    dialog.layout.layout(true);
    previewText.text = newName;
    previewText.minimumSize.width = 10;
  }
  
  layerNameInput.active = true;
  
  // Show a list of recent renames
	if ( previousLayerNames ) {
		for ( var i = previousLayerNames.length; i--; ) {
	    var prevText = previousLayerNames[i];
	    var rnet = panel1.add("edittext", undefined, prevText);
	    rnet.preferredSize.width = 520;
	  }
	}
  else {
		dialog.remove( panel1 );
	}
  
  // When rename button is clicked, start renaming
  // and write the file that stores recent renames.
  var newText = null;
  btnOk.onClick = function() {
    newText = layerNameInput.text;
    dialog.close();
    
    if ( previousLayerNames ) {
      
      for ( var i = 0; i < previousLayerNames.length; i++ ) {
        var prevText = previousLayerNames[i];
        if ( prevText === newText ) {
          previousLayerNames.splice( i, 1 );
        }
      }
      previousLayerNames.push( newText );
      
      while ( previousLayerNames.length >= 6 ) {
        previousLayerNames.splice( 0, 1 );
      }
      
    }
    else {
      previousLayerNames = [newText];
    }
    
    writeFile( textFilePath, previousLayerNames );
    
  };
  
  dialog.show();
  
  return newText;
  
}


function writeFile( filePath, array ) {
	
	var file = new File( filePath );
	file.open('w');
	file.writeln( array.join(',') );
	file.close();
	
}
function readFile( filePath ) {
	
	var file = new File( filePath ),
	fileOpen = file.open('r');
	var array = file.readln();
	file.close();
	
	return !fileOpen ? false : array.split(',');
	
}
