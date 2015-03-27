/*
 * Copyright 2015 Aurélien JABOT <aurelien.jabot+nuvola@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

(function(Nuvola)
{

// Create media player component
var player = Nuvola.$object(Nuvola.MediaPlayer);

// Handy aliases
var PlaybackState = Nuvola.PlaybackState;
var PlayerAction = Nuvola.PlayerAction;

// Create new WebApp prototype
var WebApp = Nuvola.$WebApp();

// Initialization routines
WebApp._onInitWebWorker = function(emitter)
{
    Nuvola.WebApp._onInitWebWorker.call(this, emitter);

    var state = document.readyState;
    if (state === "interactive" || state === "complete")
        this._onPageReady();
    else
        document.addEventListener("DOMContentLoaded", this._onPageReady.bind(this));
}

// Page is ready for magic
WebApp._onPageReady = function()
{
    // Connect handler for signal ActionActivated
    Nuvola.actions.connect("ActionActivated", this);

    // Start update routine
    this.update();
}

// Extract data from the web page
WebApp.update = function()
{
    var track = {
        title: null,
        artist: null,
        album: null,
        artLocation: null
    }

    var tuner;

    try
    {
        //getting the player element
        tuner = document.getElementById("tuner"); 

        //state management
        switch(tuner.className)
        {
            case "playing":
                var state = PlaybackState.PLAYING;
                break;
            case "stopped":
                var state = PlaybackState.PAUSED;
                break;
            default:
                var state = PlaybackState.UNKNOWN;
                break;
        }
    }
    catch(e)
    {
        // Always expect errors, e.g. document.getElementById("status") might be null
        var state = PlaybackState.UNKNOWN;
    }

    //getting track/radio information
    var title = tuner.querySelector("div.line1").innerText;

    if (title.indexOf("-") > -1)
    {
        //the title is displayed using the "titel - artist" format
        var aTitle = title.split('-');
        track.title = aTitle[0];
        track.artist = aTitle[1];
    }
    else
    {
        //if there is no title, the player just displays live
        track.title = title;
        track.artist = title;
    }
    
    //for the album, we're using the radio name in the player
    track.album = tuner.querySelector("div.line2").innerText;
    
    var logo = tuner.querySelector("div.artwork img.logo");
    if(!!logo)
    {
        track.artLocation = tuner.querySelector("div.artwork img.logo").src;
    }

    //updating nuvola's state
    player.setPlaybackState(state);
    player.setTrack(track);
    player.setCanPlay(state === PlaybackState.PAUSED);
    player.setCanPause(state === PlaybackState.PLAYING);


    // Schedule the next update
    setTimeout(this.update.bind(this), 500);
}

// Handler of playback actions
WebApp._onActionActivated = function(emitter, name, param)
{
    //getting the player element
    var tuner = document.getElementById("tuner");

    //managing nuvola's player's action
    switch (name)
    {
        case PlayerAction.TOGGLE_PLAY:
        case PlayerAction.PLAY:
            Nuvola.clickOnElement(tuner.querySelector("div.playbutton-cont div.icon"));
            break;
        case PlayerAction.PAUSE:
        case PlayerAction.STOP:
            Nuvola.clickOnElement(tuner.querySelector("div.playbutton-cont div.icon"));
            break;
    }
}

WebApp.start();

})(this);  // function(Nuvola)
