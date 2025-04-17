// See data/injuries.ods for basketball data

import { isSport } from "../../common/index.ts";
import helpers from "./helpers.ts";

let defaultInjuries: {
	name: string;
	frequency: number;
	games: number;
}[];

if (isSport("hockey")) {
	// https://discord.com/channels/@me/778760871911751700/1340867968325652480
	defaultInjuries = [
		{
			name: "Torn ACL",
			frequency: 38,
			games: 100,
		},
		{
			name: "Torn Achilles Tendon",
			frequency: 10,
			games: 100,
		},
		{
			name: "Fractured Neck",
			frequency: 1,
			games: 100,
		},
		{
			name: "Dislocated Knee",
			frequency: 2,
			games: 100,
		},
		{
			name: "Fractured Leg",
			frequency: 19,
			games: 80,
		},
		{
			name: "Torn MCL",
			frequency: 17,
			games: 60,
		},
		{
			name: "Torn PCL",
			frequency: 4,
			games: 60,
		},
		{
			name: "Torn Calf",
			frequency: 12,
			games: 45,
		},
		{
			name: "Fractured Kneecap",
			frequency: 8,
			games: 42,
		},
		{
			name: "Torn Bicep",
			frequency: 6,
			games: 40,
		},
		{
			name: "Fractured Arm",
			frequency: 11,
			games: 35,
		},
		{
			name: "Torn Tricep",
			frequency: 8,
			games: 31,
		},
		{
			name: "Fractured Orbital Socket",
			frequency: 1,
			games: 30,
		},
		{
			name: "Torn Meniscus",
			frequency: 68,
			games: 25.4,
		},
		{
			name: "Fractured Ankle",
			frequency: 28,
			games: 24.2,
		},
		{
			name: "Broken Collarbone",
			frequency: 12,
			games: 21.6,
		},
		{
			name: "Heart Attack",
			frequency: 0.01,
			games: 20.5,
		},
		{
			name: "Fractured Foot",
			frequency: 111,
			games: 20.46,
		},
		{
			name: "High Ankle Sprain",
			frequency: 54,
			games: 20.3,
		},
		{
			name: "Concussion",
			frequency: 186,
			games: 20,
		},
		{
			name: "Herniated Disc",
			frequency: 67,
			games: 19.55,
		},
		{
			name: "Fractured Cheekbone",
			frequency: 1,
			games: 18.5,
		},
		{
			name: "Fractured Wrist",
			frequency: 128,
			games: 18.38,
		},
		{
			name: "Dislocated Shoulder",
			frequency: 79,
			games: 17,
		},
		{
			name: "Fractured Jaw",
			frequency: 23,
			games: 15.7,
		},
		{
			name: "Fractured Hand",
			frequency: 114,
			games: 13.8,
		},
		{
			name: "Skate to Face",
			frequency: 1,
			games: 11,
		},
		{
			name: "Fractured Tailbone",
			frequency: 11,
			games: 11,
		},
		{
			name: "Torn Groin",
			frequency: 13,
			games: 9.6,
		},
		{
			name: "Sprained Knee",
			frequency: 288,
			games: 9.4,
		},
		{
			name: "Fractured Finger",
			frequency: 94,
			games: 8.79,
		},
		{
			name: "Fractured Thumb",
			frequency: 94,
			games: 8.79,
		},
		{
			name: "Fractured Toe",
			frequency: 106,
			games: 8.79,
		},
		{
			name: "Ruptured Eshophagus",
			frequency: 1,
			games: 7,
		},
		{
			name: "Sprained Shoulder",
			frequency: 224,
			games: 6.01,
		},
		{
			name: "Sprained Foot",
			frequency: 158,
			games: 5.4,
		},
		{
			name: "Bone Bruise",
			frequency: 7,
			games: 5.3,
		},
		{
			name: "Broken Ribs",
			frequency: 183,
			games: 4.53,
		},
		{
			name: "Plantar Fasciitis",
			frequency: 64,
			games: 3.81,
		},
		{
			name: "Sprained Wrist",
			frequency: 755,
			games: 3.8,
		},
		{
			name: "Strained Hamstring",
			frequency: 684,
			games: 3.2,
		},
		{
			name: "Strained Calf",
			frequency: 503,
			games: 3.1,
		},
		{
			name: "Back Spasms",
			frequency: 327,
			games: 3.06,
		},
		{
			name: "Strained Abdomen",
			frequency: 65,
			games: 3.01,
		},
		{
			name: "Strained Rotator Cuff",
			frequency: 74,
			games: 2.9,
		},
		{
			name: "Strained Quadriceps",
			frequency: 119,
			games: 2.61,
		},
		{
			name: "Strained Bicep",
			frequency: 91,
			games: 2.4,
		},
		{
			name: "Strained Tricep",
			frequency: 92,
			games: 2.4,
		},
		{
			name: "Bruised Knee",
			frequency: 1098,
			games: 2.15,
		},
		{
			name: "Fractured Nose",
			frequency: 51,
			games: 2.01,
		},
		{
			name: "Seizure",
			frequency: 0.01,
			games: 1.9,
		},
		{
			name: "Illness",
			frequency: 10,
			games: 1.8,
		},
		{
			name: "Bruised Tailbone",
			frequency: 54,
			games: 1.5,
		},
		{
			name: "Strained Foot",
			frequency: 94,
			games: 1.47,
		},
		{
			name: "Strained Groin",
			frequency: 309,
			games: 1.42,
		},
		{
			name: "Bruised Quadriceps",
			frequency: 403,
			games: 1.41,
		},
		{
			name: "Strained Shoulder",
			frequency: 175,
			games: 1.4,
		},
		{
			name: "Strained Hip Flexor",
			frequency: 107,
			games: 1.3,
		},
		{
			name: "Whiplash",
			frequency: 469,
			games: 1.3,
		},
		{
			name: "Facial Laceration",
			frequency: 208,
			games: 1.3,
		},
		{
			name: "Strained Neck",
			frequency: 154,
			games: 1.21,
		},
		{
			name: "Bruised Back",
			frequency: 884,
			games: 1,
		},
		{
			name: "Bruised Shoulder",
			frequency: 354,
			games: 1,
		},
		{
			name: "Bruised Foot",
			frequency: 1399,
			games: 0.9,
		},
		{
			name: "Bruised Elbow",
			frequency: 345,
			games: 0.9,
		},
		{
			name: "Bruised Leg",
			frequency: 1792,
			games: 0.8,
		},
		{
			name: "Bruised Hip",
			frequency: 688,
			games: 0.8,
		},
		{
			name: "Throat Contusion",
			frequency: 42,
			games: 0.8,
		},
		{
			name: "Sprained Finger",
			frequency: 405,
			games: 0.56,
		},
		{
			name: "Sprained Thumb",
			frequency: 329,
			games: 0.56,
		},
		{
			name: "Sprained Ankle",
			frequency: 183,
			games: 0.54,
		},
		{
			name: "Bruised Ribs",
			frequency: 726,
			games: 0.4,
		},
		{
			name: "Bruised Eye",
			frequency: 63,
			games: 0.32,
		},
		{
			name: "Fractured Tooth",
			frequency: 90,
			games: 0.23,
		},
		{
			name: "Bruised Hand",
			frequency: 1189,
			games: 0.2,
		},
	];
} else {
	defaultInjuries = [
		{
			name: "Sprained Ankle",
			frequency: 1808,
			games: 3.46,
		},
		{
			name: "Patellar Tendinitis",
			frequency: 1493,
			games: 6.95,
		},
		{
			name: "Back Spasms",
			frequency: 999,
			games: 3.94,
		},
		{
			name: "Strained Hamstring",
			frequency: 413,
			games: 4.42,
		},
		{
			name: "Strained Groin",
			frequency: 394,
			games: 3.59,
		},
		{
			name: "Sprained Knee",
			frequency: 392,
			games: 11.15,
		},
		{
			name: "Plantar Fasciitis",
			frequency: 362,
			games: 5.64,
		},
		{
			name: "Bruised Quadriceps",
			frequency: 338,
			games: 1.41,
		},
		{
			name: "Bruised Knee",
			frequency: 321,
			games: 2.15,
		},
		{
			name: "Sprained Finger",
			frequency: 308,
			games: 1.09,
		},
		{
			name: "Strained Calf",
			frequency: 259,
			games: 8.02,
		},
		{
			name: "Bruised Leg",
			frequency: 227,
			games: 1.39,
		},
		{
			name: "Bruised Hip",
			frequency: 218,
			games: 1.14,
		},
		{
			name: "Sprained Foot",
			frequency: 207,
			games: 4.18,
		},
		{
			name: "Achilles Tendinitis",
			frequency: 204,
			games: 5.09,
		},
		{
			name: "Sprained Thumb",
			frequency: 196,
			games: 4.14,
		},
		{
			name: "Sprained Wrist",
			frequency: 181,
			games: 4.7,
		},
		{
			name: "Lacerated Eyelid",
			frequency: 172,
			games: 0.3,
		},
		{
			name: "Sprained Shoulder",
			frequency: 158,
			games: 7.35,
		},
		{
			name: "Strained Neck",
			frequency: 124,
			games: 1.21,
		},
		{
			name: "Herniated Disc",
			frequency: 110,
			games: 19.55,
		},
		{
			name: "Bruised Back",
			frequency: 109,
			games: 1.55,
		},
		{
			name: "Bruised Foot",
			frequency: 107,
			games: 2.38,
		},
		{
			name: "Fractured Foot",
			frequency: 106,
			games: 20.46,
		},
		{
			name: "Strained Foot",
			frequency: 102,
			games: 2.96,
		},
		{
			name: "Torn Meniscus",
			frequency: 102,
			games: 23.74,
		},
		{
			name: "Strained Quadriceps",
			frequency: 101,
			games: 3.09,
		},
		{
			name: "Fractured Hand",
			frequency: 100,
			games: 14.7,
		},
		{
			name: "Fractured Tooth",
			frequency: 90,
			games: 0.23,
		},
		{
			name: "Rotator Cuff Tendinitis",
			frequency: 89,
			games: 3.4,
		},
		{
			name: "Strained Hip Flexor",
			frequency: 87,
			games: 3.4,
		},
		{
			name: "Elbow Tendinitis",
			frequency: 84,
			games: 2.42,
		},
		{
			name: "Bruised Shoulder",
			frequency: 75,
			games: 0.83,
		},
		{
			name: "Concussion",
			frequency: 73,
			games: 3.01,
		},
		{
			name: "Fractured Nose",
			frequency: 73,
			games: 1.26,
		},
		{
			name: "Bruised Elbow",
			frequency: 72,
			games: 0.89,
		},
		{
			name: "Strained Rotator Cuff",
			frequency: 70,
			games: 3.87,
		},
		{
			name: "Bruised Hand",
			frequency: 69,
			games: 0.45,
		},
		{
			name: "Sprained Elbow",
			frequency: 64,
			games: 1.92,
		},
		{
			name: "Bruised Eye",
			frequency: 60,
			games: 0.32,
		},
		{
			name: "Strained Abdomen",
			frequency: 59,
			games: 5.8,
		},
		{
			name: "Strained Shoulder",
			frequency: 57,
			games: 1.18,
		},
		{
			name: "Fractured Finger",
			frequency: 52,
			games: 8.79,
		},
		{
			name: "Strained Patellar Tendon",
			frequency: 48,
			games: 9.46,
		},
		{
			name: "Peroneal Tendinitis",
			frequency: 45,
			games: 7.36,
		},
		{
			name: "Fractured Thumb",
			frequency: 40,
			games: 8.28,
		},
		{
			name: "Torn ACL",
			frequency: 40,
			games: 100,
		},
		{
			name: "Fractured Ankle",
			frequency: 24,
			games: 22,
		},
		{
			name: "Torn Achilles Tendon",
			frequency: 10,
			games: 100,
		},
	];
}

// Hack for football
if (isSport("football")) {
	for (const row of defaultInjuries) {
		row.games = helpers.localeParseFloat((row.games / 3).toFixed(2));
	}
} else if (isSport("baseball")) {
	for (const row of defaultInjuries) {
		row.games *= 1.5;
	}
}

export default defaultInjuries;
