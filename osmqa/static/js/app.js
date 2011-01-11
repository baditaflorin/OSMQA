var map, layer;
var frequentTags = ['highway', 'cycleway', 'building'];

function onSelectionChange() {
    $('#tileconfighelp').show();
    $('#results').empty();
    if (layer.selectedTiles.length == 1) {
        var tile = layer.selectedTiles[0];
        $('#tileconfighelp').hide();
        $('#results')
            .append($('<h2 />', {
                text: "Selected area"
            }));
        $('<p>', {
            'class': 'important',
            text: tile.location[0] + ' ' + tile.location[1]
        }).appendTo('#results');

        createTagsList();
    }
}

function createTagsList() {
    var tile = layer.selectedTiles[0];

    var h2 = $('<h2 />', {
        text: "Tags "
    });
    if (window.user) {
        
        $('<small />')
            .append('(')
            .append($('<a />', {
                text: 'ajouter un tag',
                click: function() {
                    addTagAdder();
                }
            }))
            .append(')')
            .appendTo(h2);
    }

    $('#results')
        .append(h2)
        .append($('<ul />', {
            "class": "tags"
        }));

        $.each(tile.tags, function(index, tag) {
            addTag(tag);
        });
}

function addTag(tag) {
    var tile = layer.selectedTiles[0];
    var li = $("<li />", {
        "class": "tag",
        text: tag
    });
    if (window.user) {
        li.append($("<a>", {
            "class": "close",
            text: "x",
            title: "Remove this tag ?",
            click: function() {
                layer.updateTile(tile, tag, true, function() {
                    li.fadeOut(300, function() {
                        $(this).remove();
                    });
                });
            }
        }));
    }
    li.appendTo('#results ul.tags');
}

function addTagAdder() {
    var tile = layer.selectedTiles[0];
    var tagInput = $('<input />')
        .appendTo('#results');
    tagInput.autocomplete({
        source: frequentTags,
        select: function(event, ui) {
            if (event.keyCode == 13) {
                // the keypress event will do the job itself
                return;
            }
            var val = ui.item.value;
            layer.updateTile(tile, val, false, function() {
                addTag(val);
            });
            ui.item.value = '';
        },
        minLength: 0,
        delay: 0
    }).focus(function(){
        if (this.value === "") {
            $(this).trigger('keydown.autocomplete');
        }
    });
    //tagInput.autocomplete('search', '');

    // checks the keypress event for enter or comma, and adds a new tag
    // when either of those keys are pressed
    tagInput.keypress(function(e) {
        if (e.which == 13 || e.which == 44) {
            e.preventDefault();
            var val = $(this).val();
            if (val !== "" && tile.tags.indexOf(val) == -1) {
                layer.updateTile(tile, val, false, function() {
                    addTag(val);
                });
                $(this).val("");
            }
        }
    });

}

function init(){
    map = new OpenLayers.Map('map');
    layer = new OpenLayers.Layer.OSM('Simple OSM Map');
    map.addLayer(layer);
    layer = new OpenLayers.Layer.Static('Simple OSM Map', window.tilesURL, {
        maxResolution: 76.43702827148438,
        buffer: 0
    });
    layer.events.on({
        'selectionchange': onSelectionChange
    });
    map.addLayer(layer);

//    var click = new OpenLayers.Control.Click({layer: layer});
//    map.addControls([click]);
    map.setCenter(
        new OpenLayers.LonLat(5.9, 45.6).transform(
            new OpenLayers.Projection('EPSG:4326'),
            map.getProjectionObject()
        ), 12
    );    

    // Map section
    $('#maptag').html('Any tag');
    var currentTagsList = $('<ul>', {
        text: 'Display validated tiles for the following tags:',
        'class': 'tags'
    }).appendTo('#maptags');
    $.each(frequentTags, function(index, tag) {
        var link = $("<a>", {
            href: "javascript:void(0);",
            click: function() {
                changeMapTag(tag);
            },
            text: tag
        });
        $('<li>')
        .append(link)
        .appendTo(currentTagsList);
    });
    $('<p>Or for one of your choice:</p>')
        .appendTo('#maptags');
    $("<input>", {
        type: "text",
        focusout: function() {
            changeMapTag(this.value);
        }
    }).appendTo('#maptags');

    if (window.user) {
        $('#results').addClass('isLogged');
    }
}

function changeMapTag(tag) {
    layer.changeTag(tag);
    $('#maptag').html(tag);
}
