
function key_resolver(key) {

    switch ( key ) {
        // drum buttons
        case '1': return [0, 0, 'drum']; break;
        case '2': return [1, 0, 'drum']; break;
        case '3': return [2, 0, 'drum']; break;
        case '4': return [3, 0, 'drum']; break;
        case 'q': return [0, 1, 'drum']; break;
        case 'w': return [1, 1, 'drum']; break;
        case 'e': return [2, 1, 'drum']; break;
        case 'r': return [3, 1, 'drum']; break;
        case 'a': return [0, 2, 'drum']; break;
        case 's': return [1, 2, 'drum']; break;
        case 'd': return [2, 2, 'drum']; break;
        case 'f': return [3, 2, 'drum']; break;
        case 'z': return [0, 3, 'drum']; break;
        case 'x': return [1, 3, 'drum']; break;
        case 'c': return [2, 3, 'drum']; break;
        case 'v': return [3, 3, 'drum']; break;

        // special buttons
        case '/': return [0, 0, 'sound']; break;
        case '*': return [0, 0, 'pattern']; break;
        case '-': return [0, 0, 'bpm']; break;
        case '7': return [0, 0, 'knob_A']; break;
        case '9': return [0, 0, 'knob_B']; break;
        case '+': return [0, 0, 'chord']; break;
        case '6': return [0, 0, 'FX']; break;
        case ' ': return [0, 0, 'play']; break;
        case 'Enter': return [0, 0, 'write']; break;

        // controlling sliders ( still in beta sooo... )
        case 'ArrowUp': slider_control('bpm', 1, 1); break;
        case 'ArrowDown': slider_control('bpm', -1, 1); break;
        case 'ArrowLeft': slider_control('a', -1, .1); break;
        case 'ArrowRight': slider_control('a', 1, .1); break;
        case ',': slider_control('b', -1, .1); break;
        case '.': slider_control('b', 1, .1); break;
    };

    return [0, 0, 'none'];
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
