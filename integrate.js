/*
 * Copyright 2015 Aurélien JABOT <nuvola@ajabot.io>
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

    var state, app, broadcast, favorites, displayPrevNextButtons;

    //Status management
    try
    {
        //getting the javascript app
        app = TuneIn.app;

        //state management
        switch(app.attributes.playState)
        {
            case "playing":
                state = PlaybackState.PLAYING;
                break;
            case "stopped":
                state = PlaybackState.PAUSED;
                break;
            default:
                state = PlaybackState.UNKNOWN;
                break;
        }
    }
    catch(e)
    {
        //Status unknown on errors
        state = PlaybackState.UNKNOWN;
    }
    finally
    {
        //Updating Nuvola's status
        player.setPlaybackState(state);

        player.setCanPlay(state === PlaybackState.PAUSED);
        player.setCanPause(state === PlaybackState.PLAYING);
    }

    //Track information management
    try
    {
        broadcast = TuneIn.app.nowPlayingPoller;

        //getting track/radio information
        track.title = broadcast.nowPlaying.Title;

        if (track.title.indexOf(" - ") >= 0) {
            var titleInfo = track.title.split(" - ");
            track.title = titleInfo[1];
            track.artist = titleInfo[0];
        } else {
            track.artist = broadcast.attributes.Artist;
        }
        track.album = null;

        if (broadcast.nowPlaying.Image)
        {
            track.artLocation = broadcast.nowPlaying.Image;
        }
        else
        {
            //if we don't have album art, we take radio logo
            track.artLocation = broadcast.broadcast.EchoData.imageUrl;
        }
    }
    catch(e)
    {

    }
    finally
    {
        //updating track information
        player.setTrack(track);
    }

    //Prev/Next Management
    try
    {
        favorites = document.getElementById("favoritePane");
        //we display the next/previous buttons if the favorites list is visible and has more than one element
        //and a station is playing and we have its ID

        displayPrevNextButtons = favorites && TuneIn.app.nowPlayingPoller.broadcast.StationId && favorites.childNodes.length > 1;
        player.setCanGoPrev(displayPrevNextButtons);
        player.setCanGoNext(displayPrevNextButtons);
    }
    catch(e)
    {
        player.setCanGoPrev(false);
        player.setCanGoNext(false);
    }


    // Schedule the next update
    setTimeout(this.update.bind(this), 500);
}

// Handler of playback actions
WebApp._onActionActivated = function(emitter, name, param)
{
    //getting the player element
    var tuner = document.getElementById("tuner");
    var userNav = document.getElementById("userNav");

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
        case PlayerAction.PREV_SONG:
            var previousElement = this.getPreviousElement();
            if (previousElement)
            {
                Nuvola.clickOnElement(previousElement.querySelector("span._playTarget span.icon"));
                Nuvola.clickOnElement(userNav.querySelector("div.drawer a.my-profile"));
            }
            break;
        case PlayerAction.NEXT_SONG:
            var nextElement = this.getNextElement();

            if (nextElement)
            {
                Nuvola.clickOnElement(nextElement.querySelector("span.play-button._playTarget span.icon"));
                Nuvola.clickOnElement(userNav.querySelector("div.drawer a.my-profile"));
            }
            break;
    }
}

//returns the previous li element of the favorites list
WebApp.getPreviousElement = function()
{
    try
    {
        var favorites = document.getElementById("favoritePane");
        var stationId = TuneIn.app.nowPlayingPoller.broadcast.StationId;

        var position = this.getElementPosition(favorites.childNodes, stationId);

        if (position == 0)
        {
            return favorites.lastChild;
        }
        else
        {
            position--;
            return favorites.childNodes[position];
        }
    }
    catch(e)
    {
        return null;
    }
}

//returns the next li element of the favorites list
WebApp.getNextElement = function()
{
    try
    {
        var favorites = document.getElementById("favoritePane");
        var stationId = TuneIn.app.nowPlayingPoller.broadcast.StationId;

        var position = this.getElementPosition(favorites.childNodes, stationId);

        if (position == favorites.childNodes.length - 1)
        {
            return favorites.firstChild;
        }
        else
        {
            position++;
            return favorites.childNodes[position];
        }
    }
    catch(e)
    {
        return null;
    }
}

//gets the position of the current station in the favorites list
WebApp.getElementPosition = function(favorites, stationId)
{
    for (var i = 0; i < favorites.length; i++)
    {
        if (favorites[i].getAttribute("data-stationid") == stationId)
        {
            return i;
        }
    }

    //if we don't find the current station in the list, we throw an exception
    throw "Station not found";
}

WebApp.start();

})(this);  // function(Nuvola)
