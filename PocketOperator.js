
function PocketOperator(drumkit, chordkit, icons) {

    this.sound_picking = false;
    this.picked_sound = 3; // setting picked sound to hat
    this.sounds_playing = [];

    this.pattern_chaining = false;
    this.pat_already_pressed = false;
    this.pattern_chain = [0];
    this.which_pattern = 0;

    this.bpm_ms = 500;
    this.bpmrange_ms = [60000/BPM_RANGE[0], 60000/BPM_RANGE[1]];

    this.a_knob_pressed = false;
    this.b_knob_pressed = false;
    this.a_slider_phantom = a_slider.value();
    this.b_slider_phantom = b_slider.value();

    this.chord_picking = false;
    this.chord_pattern = [];
    this.ch_pat_len = this.chord_pattern.length;
    this.ch_already_pressed = false;
    this.which_chord = 0;
    this.chord_volume = 0;
    this.curr_chord = chordkit['C'];
    this.suppress = 0;

    this.fx_active = false;

    this.playing = false;

    this.writing = false;

    this.metronome_tick = false;

    this.cursor_pos = 16;

    this.light_w = width*0.0416; // width of light indicator
    this.light_h = width*0.0200; // height of light indicator


    this.pressed = (x, y, kind) => {

        // if the kind of button clicked is other than 'drum'
        // then we activate function corresponding to it
        if ( kind != 'drum' ) {

            switch ( kind ) {
                case 'sound': this.sound_switch(); break;
                case 'pattern': this.pattern_switch(); break;
                case 'bpm': this.bpm_switch(); break;
                case 'knob_A': this.knob_A_switch(); break;
                case 'knob_B': this.knob_B_switch(); break;
                case 'chord': this.chord_switch(); break;
                case 'FX': this.fx_switch(); break;
                case 'play': this.play_switch(); break;
                case 'write': this.write_switch(); break;
            };

        } else {

            let button_num = y*4+x;

            // setting a priority chain
            // for passing the sequencer buttons

            if ( this.pattern_chaining ) {
                this.pattern_route(button_num);

                return;
            };

            if ( this.sound_picking ) {
                this.sound_route(button_num);

                return;
            };

            if ( this.writing ) {
                this.writing_route(button_num);

                return;
            };

            if ( this.chord_picking ) {
                this.chord_route(button_num, x, y);

                return;
            };

            // if no special button is pressed, we just play
            // a corresponding drum sample
            drumkit[button_num].play();
        };
    };

    // functions we route button info to, when special mode
    // (like writing or chord picking) is active
    this.sound_route = (num) => {
        this.picked_sound = num;
        this.sound_picking = false;
    };

    this.pattern_route = (num) => {
        if ( this.pat_already_pressed ) {
            this.pattern_chain.length = 0;
        };
        this.pattern_chain.push(num);
        this.pat_already_pressed = false;
    };

    this.writing_route = (num) => {
        if( drumkit[this.picked_sound].is_there(num) ) {
            drumkit[this.picked_sound]
                .erase(num);

            return;
        };

        drumkit[this.picked_sound]
            .add(num);

        if ( this.a_knob_pressed ) {
            let value = a_slider.value();
            let semitones = map(value, 0, 1, 0, 12);

            drumkit[this.picked_sound]
                .add_mod(num, 0, semitones);
        };

        if ( this.b_knob_pressed ) {
            let b_value = b_slider.value();
            let pan_value = map(b_value, 0, 1, -1, 1);

            drumkit[this.picked_sound]
                .add_mod(num, 1, pan_value);
        };
    };

    this.chord_route = (num, x, y) => {
        if ( this.ch_already_pressed ) {
            this.chord_pattern.length = 0;
        };
        this.chord_pattern.push([CHORD_POS[y][x], num]);
        this.ch_already_pressed = false;
    };

    // switch for 'sound' button pressed
    this.sound_switch = () => {
        this.sound_picking = !this.sound_picking;
    };

    // switch for 'pattern' button pressed
    this.pattern_switch = () => {
        if ( this.pattern_chaining && !this.playing ) {
            this.which_pattern = 0;
            this.push_pattern();
        };
        this.pattern_chaining = !this.pattern_chaining;
        this.pat_already_pressed = true;
    };

    // if bpm_switch is activated it changes po's bpm in ms
    this.bpm_switch = () => {
        // well take bpm slider value as a param later its a todo thing
        this.bpm_ms = 60000/bpm;
    };

    // handler for the A_knob
    this.knob_A_switch = () => {
        // listerner for slider dragging
        a_slider.input( () => {
            let value = a_slider.value();

            // if we're in chord picking special mode,
            // we set this phantom var to knob_A's value
            // we do this so chord's volume doesn't change
            // when we mod drumkit's sounds
            // we do the same for knob_B
            if ( this.chord_picking && this.chord_pattern.length > 0 ) {
                this.a_slider_phantom = value;
                this.chord_volume = value;
                this.curr_chord.volume(this.chord_volume);
            } else {
                let semitones = map(value, 0, 1, 0, 12);
                drumkit[this.picked_sound].modulate(semitones);
            };
        });

        this.a_knob_pressed = !this.a_knob_pressed;
        if ( this.a_knob_pressed ) {
            a_slider.show();
        } else {
            a_slider.hide();
        };
    };

    // handler for the B_knob
    this.knob_B_switch = () => {
        // listerner for slider dragging
        b_slider.input( () => {
            let value = b_slider.value();

            if ( this.chord_picking && this.chord_pattern.length > 0 ) {
                this.b_slider_phantom = value;

            } else {
                let pan_value = map(value, 0, 1, -1, 1);
                drumkit[this.picked_sound].pan(pan_value);
            };
        });

        this.b_knob_pressed = !this.b_knob_pressed;
        if ( this.b_knob_pressed ) {
            b_slider.show();
        } else {
            b_slider.hide();
        };
    };

    // switch for 'chord' button pressed
    this.chord_switch = () => {
        this.chord_picking = !this.chord_picking;
        this.ch_already_pressed = true;
    };

    // switch for 'fx' button pressed
    this.fx_switch = () => {
        this.fx_active = !this.fx_active;
    };

    // a safe way for external checking if fx button has been clicked
    this.is_fx_active = () => {
        return this.fx_active;
    };

    // a safe way for external checking if PocketOperator is in playing mode
    this.is_playing = () => {
        return this.playing;
    };

    // switch for 'write' button pressed
    this.write_switch = () => {
        this.writing = !this.writing;
    };

    // function changing current pattern to the next pattern
    this.push_pattern = () => {
        let chain_len = this.pattern_chain.length;

        // this is essential so that modulo later on works out
        if ( chain_len == 0 ) {
            chain_len = 1;
        };

        // looping through every Sound in drumkit and changing
        // their selected pattern
        for ( let x = 0; x < 16; x++ ) {
            drumkit[x].change_pattern(this.pattern_chain[this.which_pattern%chain_len]);
        };

        this.which_pattern+=1;
    };

    // function that deals with all the stuff that's about to happen
    // when we click the almighty 'play' button, exciting stuff
    this.play_switch = () => {

        this.which_chord = 0;
        this.chord_volume = 0;

        this.which_pattern = 0;
        this.push_pattern();

        // this bit stops chord when we want to stop playing
        if ( this.playing ) {
            let ch_names_concat = chord_names.concat(chord_names_mod);
            if ( this.chord_pattern.length > 0 ) {
                for ( let x = 0; x < 16; x++ ) {
                    chordkit[ch_names_concat[x].name].stop();
                };
            };
        };

        // function for playing chords
        this.play_chord = () => {
            // if called, stops curently selected chord
            this.curr_chord.stop();

            // if there are chords selected
            if ( this.chord_pattern.length > 0 ) {
                this.curr_chord = chordkit[
                    this.chord_pattern[
                        this.which_chord%this.chord_pattern.length
                    ][0]
                ];

                // setting volume for our chord
                this.curr_chord.volume(this.chord_volume);

                // setting our selected chord to loop
                this.curr_chord.loop();

                // pushing selected chord to the next one
                this.which_chord+=1;
            };
        };

        // function helping push cursor_pos one step forward
        // and dealing with all soundy things depending
        // on cursor_pos
        let push_cursor = () => {

            // playing sounds on current cursor position
            play_on_cursor();

            // if cursor goes to next row we set next tick
            // for the metronome
            if ( this.cursor_pos % 4 == 0 ) {
                this.metronome_tick = !this.metronome_tick;
            };

            // we want to reset sidechain suppressor a little bit earlier tho
            // it sounds better
            if ( this.cursor_pos % 4 == 0 ) {
                this.suppress = 1;
                if ( b_slider.value() == 0 ) {
                    this.chord_volume = this.a_slider_phantom;
                };
            }

            // if cursor_pos reaches the last pos it can
            // we push to the next pattern
            if ( this.cursor_pos == 15 ) {
                this.push_pattern();
            };

            // if cursor_pos reaches 0, we play a chord
            if ( this.cursor_pos == 0 ) {
                this.play_chord();
            };

            // pushing cursor one step forward
            this.cursor_pos = (this.cursor_pos+1)%16;
        };

        // playing every sound that are programmed to play
        // on current cursor_pos
        let play_on_cursor = () => {

            this.sounds_playing.length = 0;

            // looping through the entire drumkit and checking
            // if any pattern includes current cursor position
            for ( let x = 0; x < 16; x++ ) {

                if ( drumkit[x].is_there(this.cursor_pos) ) {

                    // if there's no modulation information
                    // we assign it
                    let mod_lvl = 0;
                    let pan_lvl = 0;
                    // if any of the knobs' sliders are visible
                    // we automate and write mod info on the fly
                    if ( this.writing && this.a_knob_pressed) {
                        let a_value = a_slider.value();
                        let semitones = map(a_value, 0, 1, 0, 24);
                        drumkit[this.picked_sound]
                            .add_mod(this.cursor_pos, 0, semitones);
                    };
                    if ( this.writing && this.b_knob_pressed ) {
                        let b_value = b_slider.value();
                        let pan_value = map(b_value, 0, 1, -1, 1);
                        drumkit[this.picked_sound]
                            .add_mod(this.cursor_pos, 1, pan_value);
                    };

                    // reading the sound's mod and pan levels
                    // for current cursor pos
                    mod_lvl = drumkit[x].mod_lvl(this.cursor_pos);
                    pan_lvl = drumkit[x].pan_lvl(this.cursor_pos);

                    // and modulating accordingly
                    drumkit[x].modulate(mod_lvl);
                    drumkit[x].pan(pan_lvl);

                    // after we're done with all this
                    // we can finally play our sample
                    drumkit[x].play();

                    // the last thing we do is push sound's pos
                    // so when we're not in any special mode
                    // we can see currently playing sounds light up
                    this.sounds_playing.push(x);
                };
            };
        };

        // main playing recursive function with interval
        let rec_tim = () => {
            // setTimeout( () => {
            //     if ( this.playing ) {
            //         push_cursor();
            //         rec_tim();
            //     }
            // }, this.bpm_ms/4 );

            // now this /\ but using tock for more accuracy
            // and hopefully less stuttering
            this.timer = new Tock({
                countdown: true,
                complete: () => {
                    if ( this.playing ) {
                        push_cursor();
                        rec_tim();
                    };
                }
            });

            this.timer.start( Math.ceil(this.bpm_ms/4) );
        };

        // if the button is clicked when the playing mode is
        // already on, then we set the cursor_pos to 16,
        // just because we don't check that far
        // also we dont have that many buttons,
        // so nothing will light up
        // its just more pretty than setting it to null
        if ( !this.playing ) {
            // and of course setting it to 0
            // when pressed for the (first time)%2
            this.cursor_pos = 0;
            rec_tim();
        } else {
            this.cursor_pos = 16;
        };
        this.playing = !this.playing;
    };

    // po-20 chord sidechain effect function
    this.sidechain = () => {

        // lerping suppressor value we subtract from chord volume
        // to achieve the sidechainy effect
        let b_value = this.b_slider_phantom;
        if ( this.playing && b_value > 0 ) {
            let a_value = this.a_slider_phantom;
            this.suppress = lerp(this.suppress,
                                0,
                                map(this.bpm_ms,
                                    this.bpmrange_ms[1], this.bpmrange_ms[0],
                                    0.01, 0.1));

            this.chord_volume = (1 - this.suppress*b_value)*a_value;
            this.curr_chord.volume(this.chord_volume);
        };
    };

    // main drawing function
    this.draw = () => {

        // drawing knob_A's and knob_B's levels
        fill(0);
        rect(width*0.801, width*0.5, width*0.052, -(width*(a_slider.value()+0.10)*0.12));
        rect(width*0.861, width*0.5, width*0.052, -(width*(b_slider.value()+0.10)*0.12));

        // calling sidechain every frame so the lerping
        // takes place
        this.sidechain();

        // drawing selected sound
        let icon_size = width*0.16;
        let icon_w = width*0.43;
        let icon_h = width*0.34;
        this.ch_pat_len = this.chord_pattern.length;
        if ( !this.chord_picking || this.ch_pat_len == 0 ) {
            image(icon_sep[this.picked_sound],
                icon_w, icon_h, icon_size, icon_size);

        } else {
            this.which_chord = this.which_chord%this.chord_pattern.length;
            if ( this.ch_already_pressed ) {
                image(ch_icon_sep[this.chord_pattern[this.which_chord][1]],
                    icon_w, icon_h, icon_size, icon_size);
            } else {
                image(ch_icon_sep[this.chord_pattern[this.ch_pat_len-1][1]],
                    icon_w, icon_h, icon_size, icon_size);
            };
        };

        // drawing the metronome
        fill(0);
        strokeWeight(2);
        let sp_x = width*0.274;
        let sp_y = width*0.30;
        let ep_x = sp_x-width*0.03;
        let ep_y = width*0.28;
        let metronome_offset = width*0.06;
        let ellipse_size = width*0.01;
        if ( !this.metronome_tick ) {
            line(sp_x, sp_y, ep_x, ep_y);
            ellipse(ep_x, ep_y, ellipse_size);
        } else {
            line(sp_x, sp_y, ep_x+metronome_offset, ep_y);
            ellipse(ep_x+metronome_offset, ep_y, ellipse_size);
        };
        strokeWeight(1);
        fill(255);

        // drawing play icon
        if ( this.playing ) {
            fill(0);
            beginShape(TRIANGLE_STRIP);
            let sp_x = width*0.146;
            let sp_y = width*0.518;
            let triangle_size = width*0.04;
            vertex(sp_x, sp_y);
            vertex(sp_x, sp_y+triangle_size);
            vertex(sp_x+triangle_size, sp_y+triangle_size*0.5);
            endShape();
            fill(255);
        };

        // discerning which buttons we want do be lit up at the moment
        this.to_show = [];
        this.to_show_concat = () => {

            // i know we just started, but
            // from now on here things start to get messy cos of mixed
            // priority for pages and lights, so i mix using returns at the end
            // and just plain old long ugly 3 conditional if statements

            if ( this.playing && !this.writing && !this.chord_picking ) {
                this.to_show = this.to_show.concat(
                    this.sounds_playing
                );
            };

            if ( this.pattern_chaining ) {
                this.to_show = this.to_show.concat(
                    this.pattern_chain
                );

                return;
            };

            if ( this.writing || !this.playing && !this.chord_picking) {
                this.to_show = this.to_show.concat(
                    drumkit[this.picked_sound].ret_pattern()
                );
            };

            if ( this.chord_picking && !this.writing ) {
                for ( let x = 0; x < this.chord_pattern.length; x++ ) {
                    this.to_show.push(this.chord_pattern[x][1]);
                };
                return;
            };

            this.to_show.push(this.cursor_pos);

        };
        this.to_show_concat();

        // drawing button grid lights
        // and i think we should pass this to draw in main script
        // to be done ( coz it works for now lol )
        for ( let x = 0; x < 4; x++ ) {
            for ( let y = 0; y < 4; y++ ) {
                let here_x = (interspace_x)*x+padding_x*0.82;
                let here_y = (interspace_y)*y+padding_y*0.92;

                if ( this.to_show.includes(y*4+x) ) {
                    fill(255, 0, 0);
                } else {
                    fill(255);
                };
                rect(here_x, here_y, this.light_w, this.light_h);
            };
        };

        // drawing the play button light
        let here_x = (padding_x*0.82)+(interspace_x*4);
        let here_y = (padding_y*0.92)+(interspace_y*2);

        if ( this.playing && this.cursor_pos % 4 == 0 ) {
            fill(255, 0, 0);
        } else {
            fill(255);
        };
        rect(here_x, here_y, this.light_w, this.light_h);

        // drawing the write button pressed indicator
        if ( this.writing ) {
            let here_x = width*0.093;
            let here_y = width*0.516;
            let here_size = width*0.04;
            fill(255, 40, 0);
            rect(here_x, here_y, here_size, here_size);
            fill(255);
        };

        // drawing the pattern button pressed indicator
        if ( this.pattern_chaining ) {
            let here_x = width*0.319;
            let here_y = width*0.757;
            let here_size = width*0.056;
            fill(255, 0, 0);
            ellipse(here_x, here_y, here_size);
            fill(255);
        };

        // drawing the chord button pressed indicator
        if ( this.chord_picking ) {
            let here_x = width*0.874;
            let here_y = width*0.966;
            let here_size = width*0.056;
            fill(255, 0, 0);
            ellipse(here_x, here_y, here_size);
            fill(255);
        };

        // drawing the fx button pressed indicator
        if ( this.fx_active ) {
            let here_x = width*0.874;
            let here_y = width*1.176;
            let here_size = width*0.056;
            fill(255, 0, 0);
            ellipse(here_x, here_y, here_size);
            fill(255);
        };

        // drawing the sound button pressed indicator
        if ( this.sound_picking ) {
            let here_x = width*0.134;
            let here_y = width*0.757;
            let here_size = width*0.056;
            fill(255, 0, 0);
            ellipse(here_x, here_y, here_size);
            fill(255);
        };
    };
};
