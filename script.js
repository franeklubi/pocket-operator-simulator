
let po;

const ratio = {'w': 480, 'h': 844};

let disclaimer_gone = false;

let img;
let padding_x
let padding_y;
let interspace_x;
let interspace_y;

let files_loaded = 0;
let loading_completed = false;
let drums_loading = [];
let button_size;

let loading_angle = 0;

let bpm_slider;
let bpm;
let a_slider;
let b_slider;

let drumkit = [];
let icongrid;
let icondata;
let icon_sep = [];

let chorddata;
let ch_icondata;
let ch_icongrid;
let ch_icon_sep = [];
let chord_names = [];
let chordkit = {};
let chord_names_mod;

const BPM_RANGE = [60, 240];
const FUNC_BUTTONS = [
    [0, -1, 'sound'],  [1, -1, 'pattern'], [2, -1, 'bpm'],
    [3, -1, 'knob_A'], [4, -1, 'knob_B'],  [4, 0, 'chord'],
    [4, 1, 'FX'],      [4, 2, 'play'],     [4, 3, 'write']
];

const CHORD_POS = [
    [['Dm'], ['Em'],  ['Esus'], ['E']],
    [['F'],  ['G'],   ['C/G'],  ['E/G#']],
    [['Am'], ['C/A'], ['Dm/A'], ['D/A']],
    [['A'],  ['B/A'], ['C'],    ['D']]
];

function load_files(callback) {

    // loading icons and their respective locations
    // from premade files to variables used in setup
    icondata = loadJSON('./assets/icons/icon_grid.json');
    icongrid = loadImage('./assets/icons/icon_grid.png');
    ch_icondata = loadJSON('./assets/icons/chord_grid.json');
    ch_icongrid = loadImage('./assets/icons/chord_grid.png');

    img = loadImage("assets/po20.png");

    // loading up chords information
    chorddata = loadJSON('./assets/sounds/chords/chords.json', () => {
        // we parsin the chords into array
        let chord_path = './assets/sounds/chords/';
        chord_names = chorddata.chords;
        for ( let x = 0; x < 8; x++ ) {
            chordkit[chord_names[x].name] =
            new Sound(chord_path+chord_names[x].filename+'.wav', () => {
                files_loaded+=1;
            });
        };

        // and also while we're here we can modulate
        // our existing 8 chords to make up the other 8
        chord_names_mod = chorddata.modulated;
        for ( let x = 0; x < 8; x++ ) {
            let mod_info = chord_names_mod[x];
            let orig = mod_info.root;
            let modulated = new Sound(chord_path+orig+'.wav', () => {
                files_loaded+=1;
                if ( x == 7 ) {
                    this.load_drumkit();
                };
            });
            modulated.modulate(mod_info.semitones);
            chordkit[mod_info.name] = modulated;
        };
    });


    // func for loading up drumkit
    this.load_drumkit = () => {
        for ( let x = 1; x <= 16; x++ ) {
            let loaded_sound = new Sound('./assets/sounds/drums/'+x+'.wav', () => {
                files_loaded+=1;
                if ( x == 16 ) {
                    callback();
                    loading_completed = true;
                };
            });
            drumkit.push( loaded_sound );
        };
    };
};

function setup() {

    // setting width and height of our canvas
    let po_h = windowHeight;
    let po_w = (ratio['w']*po_h)/ratio['h']; // width is derived from ratio and po_h
    let cnvs = createCanvas(po_w, po_h).parent('canvas');

    frameRate(60);

    // checking if we can load external sounds, if not,
    // frick it, its not like i care about you using a
    // feature i spent 16 days working on
    if ( window.File && window.FileReader && window.FileList && window.Blob ) {
        console.log('All file apis supported, nice');

        // creating drop zone
        cnvs.drop(load_drumfile);

    } else {
        alert('You won\'t be able to load external drumkit sounds because your browser sucks');
    };

    // im sorry about all the callbacks i really am but
    // if i want that pretty gnarly loading anim
    // i have to use them. tradeoffs i guess
    load_files(() => {

        // after all files are loaded we create our PocketOperator instance
        po = new PocketOperator(drumkit, chordkit, icon_sep);

        po.fx_active = true;

        // after preload loaded up json and png files
        // we are ready to parse them into an array
        let pos_info = icondata.icons;
        for ( let x = 0; x < pos_info.length; x++ ) {
            let pos = pos_info[x].position;
            let img = icongrid.get(pos.x, pos.y, pos.w, pos.h);
            icon_sep.push(img);
        };

        // the same goes for the chord icons
        let ch_pos_info = ch_icondata.icons;
        for ( let x = 0; x < ch_pos_info.length; x++ ) {
            let ch_pos = ch_pos_info[x].position;
            let ch_img = ch_icongrid.get(ch_pos.x, ch_pos.y, ch_pos.w, ch_pos.h);
            ch_icon_sep.push(ch_img);
        };

        bpm_slider.show();
    });

    button_size = width*0.0830;

    // creating and setting up a sliders
    bpm_slider = createSlider(BPM_RANGE[0], BPM_RANGE[1], 120);
    bpm_slider.parent('bpm_slider');
    bpm_slider.position(width*0.1, width*0.2);
    bpm_slider.style('width', ''+width*0.80);
    bpm_slider.hide();

    // slider for the a_knob
    a_slider = createSlider(0, 1, 0, 0.1);
    a_slider.parent('a_slider');
    a_slider.position(width*0.10, width*0.62);
    a_slider.style('width', ''+width*0.40);
    a_slider.hide();

    // and lastly for the the b_knob
    b_slider = createSlider(0, 1, 0, 0.1);
    b_slider.parent('b_slider');
    b_slider.position(width*0.50, width*0.62);
    b_slider.style('width', ''+width*0.40);
    b_slider.hide();

    // setting up padding for button drawing
    padding_x = width*0.138;
    padding_y = width*0.965;
    interspace_x = width*0.184;
    interspace_y = width*0.21;

    background(255);
    fill(255);
};

function draw() {

    if ( loading_completed ) {
        image(img, 0, 0, width, height);

        // drawing the button overlay if fx button is pressed
        if ( po.is_fx_active() ) {
            draw_about_mouse();
        };

        // printing out bpm
        fill(255);
        stroke(0);
        strokeWeight(1);
        rect(width*0.70, width*0.24, width*0.22, width*0.08);
        bpm = bpm_slider.value();
        fill(0);
        noStroke();

        // setting up text
        textSize(width*0.08);
        textAlign(CENTER, BOTTOM);
        text(bpm, width*0.81, width*0.325);

        stroke(0);
        fill(255);

        // drawing po
        po.draw();

        // drawing loading anim for each of the
        // corresponding sequencer buttons
        draw_drums_loading();

        // drawing the disclaimer
        if ( !disclaimer_gone ) {
            draw_disclaimer();
        };

    } else {

        // setting up text
        textSize(width*0.08);
        textAlign(CENTER, TOP);
        text(bpm, width*0.81, width*0.31);

        background(0);

        fill(200);
        let r = width*0.20;
        ellipse(width*0.50, height*0.50, r*2, r*2);


        fill(60, 22, 100);
        stroke(0);
        text('arcade', width*0.30, width*0.50, width*0.40, height*0.20);

        stroke(60, 22, 100);
        strokeWeight(1);
        beginShape();
        vertex(width*0.50, height*0.50);
        for ( let i = 0; i <= files_loaded; i++ ) {
            let a = map(i, 0, 32, 0, 6.5);
            x = r * Math.cos(a) + width*0.50;
            y = r * Math.sin(a) + height*0.50;
            vertex(x,y);
        };
        vertex(width*0.50, height*0.50);
        endShape();
    };
};

function draw_about_mouse() {

    // getting information about what button is mouse
    // hovering about
    let mouse_info = mouse_resolver();

    // and drawing it if it's not undefined, duh
    if ( mouse_info != null ) {
        let here_x = (interspace_x)*mouse_info[0]+padding_x;
        let here_y = (interspace_y)*mouse_info[1]+padding_y;

        noStroke();
        fill(47, 18, 78, 100);
        ellipse(here_x, here_y, button_size*2);
    };
};

function mouse_resolver() {

    // checking for sequencer buttons
    for ( let x = 0; x < 4; x++ ) {
        for ( let y = 0; y < 4; y++ ) {
            let here_x = (interspace_x)*x+padding_x;
            let here_y = (interspace_y)*y+padding_y;
            if ( dist(here_x, here_y, mouseX, mouseY) < button_size ) {
                return [x, y, 'drum'];
            };
        };
    };

    // checking for functional buttons
    for ( let x = 0; x < 9; x++ ) {
        let here_x = (interspace_x)*FUNC_BUTTONS[x][0]+padding_x;
        let here_y = (interspace_y)*FUNC_BUTTONS[x][1]+padding_y;
        if ( dist(here_x, here_y, mouseX, mouseY) < button_size ) {
            return [FUNC_BUTTONS[x][0], FUNC_BUTTONS[x][1], FUNC_BUTTONS[x][2]];
        };
    };
};

function mouseClicked() {

    if ( loading_completed && drums_loading.length == 0 && disclaimer_gone ) {

        let mouse_info = mouse_resolver();
        if ( mouse_info != null ) {
            po.pressed(mouse_info[0], mouse_info[1], mouse_info[2]);
        };
    };

    if ( !disclaimer_gone ) {

        if ( mouseX > width*0.05 && mouseX < width*0.95 &&
            mouseY > height*0.7 && mouseY < height*0.8 ) {

            disclaimer_gone = true;
        };
    };
};

function draw_drums_loading() {

    if ( drums_loading.length > 0 ) {
        loading_angle += 0.1;
        let r = width*0.08;
        for ( let i = 0; i < drums_loading.length; i++ ) {
            let drum_x = drums_loading[i][0];
            let drum_y = drums_loading[i][1];
            let here_x = (interspace_x)*drum_x+padding_x;
            let here_y = (interspace_y)*drum_y+padding_y;

            fill(47, 18, 78, 200);
            stroke(47, 18, 78);
            ellipse(here_x, here_y, width*0.16);

            let x = r * cos(loading_angle) + here_x;
            let y = r * sin(loading_angle) + here_y;

            fill(100, 76, 50);
            stroke(100, 76, 50);
            line(here_x, here_y, x, y);
            ellipse(x, y, width*0.02, width*0.02);
        };
    };
};

function load_drumfile(file) {

    if ( file.type === 'audio' ) {

        let seq_number;
        let drum_file;

        // resolving mouse position to load file into
        // the right sequencer button
        let mouse_info = mouse_resolver();
        if ( mouse_info != null && mouse_info[2] == 'drum' ) {
            seq_number = mouse_info[1]*4+mouse_info[0];
            drums_loading.push( mouse_info );
        };

        this.success = () => {
            let index = drums_loading.indexOf(mouse_info);
            drums_loading.splice(index, 1);
            drumkit[seq_number].stop();
            drumkit[seq_number].reload_sound(drum_file);
            console.log('success!');
            drum_file.play();
        };

        this.error = () => {
            console.log('error');
            let index = drums_loading.indexOf(mouse_info);
            drums_loading.splice(index, 1);
        };

        if ( seq_number == null ) {
            console.log('not on button');
        } else {
            drum_file = new loadSound(file, this.success, this.error);
        };
    };
};

// function for drawing the disclaimer
function draw_disclaimer() {

    // setting up drawing for window and button
    stroke(47, 18, 78);
    strokeWeight(width*0.01);
    fill(255);

    // drawing the disclaimer window
    let curve = width*0.1;
    let curve_top = width*0.05;
    rect(width*0.05, height*0.3, width*0.9, height*0.5,
        curve_top, curve_top, curve, curve);

    // drawing confirmation button
    fill(47, 18, 78);
    rect(width*0.05, height*0.7, width*0.9, height*0.1,
        curve, curve, curve, curve);

    // setting up disclaimer text
    textSize(width*0.045);
    textAlign(LEFT, TOP);
    strokeWeight(width*0.001);

    // drawing the disclaimer text
    text(disclaimer_text,
        width*0.08, height*0.32, width*0.86, height*0.5);

    // setting up button text
    textSize(width*0.08);
    textAlign(CENTER, CENTER);
    fill(255);

    // drawing the button text
    text('I UNDERSTAND',
        width*0.05, height*0.7, width*0.9, height*0.1);
};
