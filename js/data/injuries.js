/**
 * @name data.injuries
 * @namespace Injuries. See basketball-gm/data/injuries.ods for more info.
 */
define([], function () {
    "use strict";

    var cumSum, gamesRemainings, types;

    cumSum = [1808, 3301, 4300, 4713, 5107, 5499, 5861, 6199, 6520, 6828, 7087, 7314, 7532, 7739, 7943, 8139, 8320, 8492, 8650, 8774, 8884, 8993, 9100, 9206, 9308, 9410, 9511, 9611, 9701, 9790, 9877, 9961, 10036, 10109, 10182, 10254, 10324, 10393, 10457, 10517, 10576, 10633, 10685, 10733, 10778, 10818, 10842, 10882];

    gamesRemainings = [3.46, 6.95, 3.94, 4.42, 3.59, 11.15, 5.64, 1.41, 2.15, 1.09, 8.02, 1.39, 1.14, 4.18, 5.09, 4.14, 4.70, 0.30, 7.35, 1.21, 19.55, 1.55, 2.38, 20.46, 2.96, 23.74, 3.09, 14.70, 0.23, 3.40, 3.40, 2.42, 0.83, 3.01, 1.26, 0.89, 3.87, 0.45, 1.92, 0.32, 5.80, 1.18, 8.79, 9.46, 7.36, 8.28, 22.00, 100];

    types = ["Sprained Ankle", "Patellar Tendinitis", "Back Spasms", "Strained Hamstring", "Strained Groin", "Sprained Knee", "Plantar Fasciitis", "Bruised Quadriceps", "Bruised Knee", "Sprained Finger", "Sprained Calf", "Bruised Leg", "Bruised Hip", "Sprained Foot", "Achilles Tendinitis", "Sprained Thumb", "Sprained Wrist", "Lacerated Eyelid", "Sprained Shoulder", "Strained Neck", "Herniated Disc", "Bruised Back", "Bruised Foot", "Fractured Foot", "Strained Foot", "Torn Meniscus", "Strained Quadriceps", "Fractured Hand", "Fractured Tooth", "Rotator Cuff Tendinitis", "Strained Hip Flexor", "Elbow Tendinitis", "Bruised Shoulder", "Concussion", "Fractured Nose", "Bruised Elbow", "Strained Rotator Cuff", "Bruised Hand", "Sprained Elbow", "Bruised Eye", "Strained Abdomen", "Strained Shoulder", "Fractured Finger", "Strained Patellar Tendon", "Peroneal Tendinitis", "Fractured Thumb", "Fractured Ankle", "Torn ACL"];

    return {
        cumSum: cumSum,
        gamesRemainings: gamesRemainings,
        types: types
    };
});