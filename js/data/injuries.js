/**
 * @name data.injuries
 * @namespace Injuries. See basketball-gm/data/injuries.ods for more info.
 */
define([], function () {
    "use strict";

    var cumSum, gamesRemainings, types;

    cumSum = [300, 500, 800, 1100, 1300, 1350, 1400, 1450, 1500, 1550, 1750, 1900, 2050, 2200, 2350, 2500, 2650, 2750, 3050, 3150, 3250, 3300, 3320, 3340, 3360, 3510, 3550, 3630, 3710, 3790, 3870, 3950, 4030, 4110, 4190, 4210, 4218, 4220, 4235, 4245, 4265, 4270, 4280, 4282, 4332, 4337, 4342, 4347, 4352, 4502, 4652, 4802, 4852, 4862, 4865, 4868, 4948, 5028, 5068, 5078, 5088, 5089, 5090];

    gamesRemainings = [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 3, 3, 3, 3, 3, 3, 5, 3, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 5, 5, 10, 3, 5, 5, 30, 30, 25, 20, 30, 15, 10, 10, 5, 5, 20, 5, 5, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 3, 2, 80, 80];

    types = ["Ankle sprain", "Back sprain", "Thigh sprain", "Knee sprain", "Wrist sprain", "Thumb sprain", "Finger sprain", "Elbow sprain", "Tail sprain", "Wing sprain", "Footpaw sprain", "Hip contusion", "Leg contusion", "Knee contusion", "Shoulder contusion", "Elbow contusion", "Tail contusion", "Muzzle contusion", "Footpaw contusion", "Ankle inflammation", "Elbow inflammation", "Tail inflammation", "Wing inflammation", "Fin inflammation", "Muzzle inflamation", "Footpaw inflammation", "Webbing inflammation", "Shoulder strain", "Rotator cuff strain", "Abdominal strain", "Shoulder strain", "Tail strain", "Webbing strain", "Whisker strain", "Wing strain", "Fin strain", "Ankle fracture", "Leg fracture", "Footpaw fracture", "Tail fracture", "Wing fracture", "Muzzle fracture", "Fang fracture", "Beak fracture", "Claw fracture", "Antler fracture", "Hoof fracture", "Horn fracture", "Fin fracture", "Body laceration", "Ear laceration", "Nose laceration", "Webbing laceration", "Fin laceration", "Whisker epilation", "Feather epilation", "Excessive shedding", "Molting", "Furball hacking", "Mange", "Fleas", "Distemper", "Rabies"];

    return {
        cumSum: cumSum,
        gamesRemainings: gamesRemainings,
        types: types
    };
});