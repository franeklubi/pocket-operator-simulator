
function Sound(path_to_sound, callback, err_callback) {
    this.sound = loadSound(path_to_sound, callback, err_callback);
    this.semitones = 0;
    this.pan_value = 0;

    this.pattern = [];
    this.mod_pattern = [];
    this.chosen_pattern = 0;

    this.populated = [];

    for ( let x = 0; x < 16; x++ ) {
        this.pattern.push([]);
        this.mod_pattern.push([]);
    };

    this.populate_mod = (which) => {
        this.populated.push(which);
        for ( let x = 0; x < 16; x++ ) {
            this.mod_pattern[which].push([0, 0]);
        };
    };
    this.populate_mod(this.chosen_pattern);

    this.get_whole_mod = () => {
        return this.mod_pattern;
    };

    this.set_whole_mod = (mod_pattern) => {
        this.mod_pattern = mod_pattern;
    };

    this.reload_sound = (loadSound_obj) => {
        this.sound = loadSound_obj;
    };

    this.is_populated = (which) => {
        return this.populated.includes(which);
    };

    this.change_pattern = (next) => {
        if ( !this.is_populated(next) ){
            this.populate_mod(next);
        };
        this.chosen_pattern = next;
    };

    this.add = (num) => {
        this.pattern[this.chosen_pattern][num] = num;
    };

    this.add_mod = (num, mod, value) => {
        this.mod_pattern[this.chosen_pattern][num][mod] = value;
    };

    this.erase = (num) => {
        this.pattern[this.chosen_pattern][num] = 16;
    };

    this.play = () => {
        this.sound.play();
    };

    this.stop = () => {
        this.sound.stop();
    };

    this.modulate = (semitones) => {
        this.semitones = semitones;
        this.sound.rate(Math.pow(2, semitones/12));
    };

    this.loop = () => {
        this.sound.loop();
    };

    this.volume = (volume) => {
        this.sound.setVolume(volume);
    };

    this.pan = (pan_value) => {
        this.pan_value = pan_value
        this.sound.pan(pan_value);
    };

    this.is_there = (num) => {
        return this.pattern[this.chosen_pattern][num] == num;
    };

    this.mod_lvl = (num) => {
        return this.mod_pattern[this.chosen_pattern][num][0];
    };

    this.pan_lvl = (num) => {
        return this.mod_pattern[this.chosen_pattern][num][1];
    };

    this.ret_pattern = () => {
        return this.pattern[this.chosen_pattern]
    };

    this.ret_whole_pattern = () => {
        return this.pattern;
    };

    this.set_pattern = (pattern) => {
        this.pattern = pattern;
    };
};
