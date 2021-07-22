/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import classNames from "classnames";
import { groupBy } from "../../../common/groupBy";
import PropTypes from "prop-types";
import {
	Fragment,
	useState,
	ReactNode,
	ChangeEvent,
	FormEvent,
	useEffect,
} from "react";
import {
	ActionButton,
	HelpPopover,
	StickyBottomButtons,
} from "../../components";
import { confirm, helpers, localActions, logEvent } from "../../util";
import { AnimatePresence, m } from "framer-motion";
import { isSport } from "../../../common";
import { settings } from "./settings";
import type { Category, Decoration, FieldType, Key, Values } from "./types";
import type { Settings } from "../../../worker/views/settings";
import Injuries from "./Injuries";
import type { InjuriesSetting } from "../../../common/types";

const settingNeedsGodMode = (
	godModeRequired?: "always" | "existingLeagueOnly",
	newLeague?: boolean,
) => {
	return !!godModeRequired && (!newLeague || godModeRequired === "always");
};

export const godModeRequiredMessage = (
	godModeRequired?: "always" | "existingLeagueOnly",
) => {
	if (godModeRequired === "existingLeagueOnly") {
		return "This setting can only be changed in God Mode or when creating a new league.";
	}
	return "This setting can only be changed in God Mode.";
};

// See play-style-adjustments in bbgm-rosters
const gameSimPresets = isSport("basketball")
	? {
			2020: {
				pace: 100.2,
				threePointers: true,
				threePointTendencyFactor: 1,
				threePointAccuracyFactor: 1,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.09,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2019: {
				pace: 100,
				threePointers: true,
				threePointTendencyFactor: 0.946,
				threePointAccuracyFactor: 0.994,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.1,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2018: {
				pace: 97.3,
				threePointers: true,
				threePointTendencyFactor: 0.881,
				threePointAccuracyFactor: 1.014,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.14,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2017: {
				pace: 96.4,
				threePointers: true,
				threePointTendencyFactor: 0.827,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.16,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2016: {
				pace: 95.8,
				threePointers: true,
				threePointTendencyFactor: 0.744,
				threePointAccuracyFactor: 0.992,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.16,
				turnoverFactor: 1.01,
				orbFactor: 1,
			},
			2015: {
				pace: 93.9,
				threePointers: true,
				threePointTendencyFactor: 0.705,
				threePointAccuracyFactor: 0.98,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.15,
				turnoverFactor: 1.02,
				orbFactor: 1.024375,
			},
			2014: {
				pace: 93.9,
				threePointers: true,
				threePointTendencyFactor: 0.676,
				threePointAccuracyFactor: 1.008,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.13,
				turnoverFactor: 1.03,
				orbFactor: 1.024375,
			},
			2013: {
				pace: 92,
				threePointers: true,
				threePointTendencyFactor: 0.64,
				threePointAccuracyFactor: 1.006,
				twoPointAccuracyFactor: 0.991,
				blockFactor: 1.1,
				stealFactor: 1.15,
				turnoverFactor: 1.04,
				orbFactor: 1.041625,
			},
			2012: {
				pace: 91.3,
				threePointers: true,
				threePointTendencyFactor: 0.595,
				threePointAccuracyFactor: 0.978,
				twoPointAccuracyFactor: 0.978,
				blockFactor: 1.1,
				stealFactor: 1.14,
				turnoverFactor: 1.04,
				orbFactor: 1.0555,
			},
			2011: {
				pace: 92.1,
				threePointers: true,
				threePointTendencyFactor: 0.577,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 0.999,
				blockFactor: 1.1,
				stealFactor: 1.08,
				turnoverFactor: 1.03,
				orbFactor: 1.034875,
			},
			2010: {
				pace: 92.7,
				threePointers: true,
				threePointTendencyFactor: 0.577,
				threePointAccuracyFactor: 0.994,
				twoPointAccuracyFactor: 1.009,
				blockFactor: 1.1,
				stealFactor: 1.09,
				turnoverFactor: 1.02,
				orbFactor: 1.031125,
			},
			2009: {
				pace: 91.7,
				threePointers: true,
				threePointTendencyFactor: 0.583,
				threePointAccuracyFactor: 1.028,
				twoPointAccuracyFactor: 0.995,
				blockFactor: 1.1,
				stealFactor: 1.1,
				turnoverFactor: 1.02,
				orbFactor: 1.041625,
			},
			2008: {
				pace: 92.4,
				threePointers: true,
				threePointTendencyFactor: 0.58,
				threePointAccuracyFactor: 1.014,
				twoPointAccuracyFactor: 0.993,
				blockFactor: 1.1,
				stealFactor: 1.1,
				turnoverFactor: 1.02,
				orbFactor: 1.041625,
			},
			2007: {
				pace: 91.9,
				threePointers: true,
				threePointTendencyFactor: 0.545,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 0.995,
				blockFactor: 1.1,
				stealFactor: 1.02,
				turnoverFactor: 1.06,
				orbFactor: 1.041625,
			},
			2006: {
				pace: 90.5,
				threePointers: true,
				threePointTendencyFactor: 0.521,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 0.98,
				blockFactor: 1.1,
				stealFactor: 1.09,
				turnoverFactor: 1.04,
				orbFactor: 1.04875,
			},
			2005: {
				pace: 90.9,
				threePointers: true,
				threePointTendencyFactor: 0.512,
				threePointAccuracyFactor: 0.997,
				twoPointAccuracyFactor: 0.964,
				blockFactor: 1.1,
				stealFactor: 1.14,
				turnoverFactor: 1.04,
				orbFactor: 1.079875,
			},
			2004: {
				pace: 90.1,
				threePointers: true,
				threePointTendencyFactor: 0.488,
				threePointAccuracyFactor: 0.972,
				twoPointAccuracyFactor: 0.943,
				blockFactor: 1.2,
				stealFactor: 1.16,
				turnoverFactor: 1.07,
				orbFactor: 1.086625,
			},
			2003: {
				pace: 91,
				threePointers: true,
				threePointTendencyFactor: 0.476,
				threePointAccuracyFactor: 0.978,
				twoPointAccuracyFactor: 0.949,
				blockFactor: 1.2,
				stealFactor: 1.16,
				turnoverFactor: 1.06,
				orbFactor: 1.079875,
			},
			2002: {
				pace: 90.7,
				threePointers: true,
				threePointTendencyFactor: 0.479,
				threePointAccuracyFactor: 0.992,
				twoPointAccuracyFactor: 0.954,
				blockFactor: 1.2,
				stealFactor: 1.17,
				turnoverFactor: 1.04,
				orbFactor: 1.090375,
			},
			2001: {
				pace: 91.3,
				threePointers: true,
				threePointTendencyFactor: 0.443,
				threePointAccuracyFactor: 0.992,
				twoPointAccuracyFactor: 0.946,
				blockFactor: 1.2,
				stealFactor: 1.15,
				turnoverFactor: 1.06,
				orbFactor: 1.0765,
			},
			2000: {
				pace: 93.1,
				threePointers: true,
				threePointTendencyFactor: 0.435,
				threePointAccuracyFactor: 0.989,
				twoPointAccuracyFactor: 0.96,
				blockFactor: 1.2,
				stealFactor: 1.17,
				turnoverFactor: 1.07,
				orbFactor: 1.086625,
			},
			1999: {
				pace: 88.9,
				threePointers: true,
				threePointTendencyFactor: 0.438,
				threePointAccuracyFactor: 0.95,
				twoPointAccuracyFactor: 0.937,
				blockFactor: 1.2,
				stealFactor: 1.17,
				turnoverFactor: 1.09,
				orbFactor: 1.111,
			},
			1998: {
				pace: 90.3,
				threePointers: true,
				threePointTendencyFactor: 0.417,
				threePointAccuracyFactor: 0.969,
				twoPointAccuracyFactor: 0.965,
				blockFactor: 1.2,
				stealFactor: 1.23,
				turnoverFactor: 1.09,
				orbFactor: 1.1215,
			},
			1997: {
				pace: 90.1,
				threePointers: true,
				threePointTendencyFactor: 0.551,
				threePointAccuracyFactor: 1.008,
				twoPointAccuracyFactor: 0.985,
				blockFactor: 1.2,
				stealFactor: 1.21,
				turnoverFactor: 1.09,
				orbFactor: 1.107625,
			},
			1996: {
				pace: 91.8,
				threePointers: true,
				threePointTendencyFactor: 0.518,
				threePointAccuracyFactor: 1.028,
				twoPointAccuracyFactor: 0.996,
				blockFactor: 1.2,
				stealFactor: 1.15,
				turnoverFactor: 1.09,
				orbFactor: 1.100875,
			},
			1995: {
				pace: 92.9,
				threePointers: true,
				threePointTendencyFactor: 0.485,
				threePointAccuracyFactor: 1.006,
				twoPointAccuracyFactor: 1.007,
				blockFactor: 1.2,
				stealFactor: 1.18,
				turnoverFactor: 1.09,
				orbFactor: 1.107625,
			},
			1994: {
				pace: 95.1,
				threePointers: true,
				threePointTendencyFactor: 0.31,
				threePointAccuracyFactor: 0.933,
				twoPointAccuracyFactor: 0.991,
				blockFactor: 1.2,
				stealFactor: 1.25,
				turnoverFactor: 1.07,
				orbFactor: 1.128625,
			},
			1993: {
				pace: 96.8,
				threePointers: true,
				threePointTendencyFactor: 0.274,
				threePointAccuracyFactor: 0.941,
				twoPointAccuracyFactor: 1.003,
				blockFactor: 1.1,
				stealFactor: 1.23,
				turnoverFactor: 1.06,
				orbFactor: 1.118125,
			},
			1992: {
				pace: 96.6,
				threePointers: true,
				threePointTendencyFactor: 0.232,
				threePointAccuracyFactor: 0.927,
				twoPointAccuracyFactor: 0.997,
				blockFactor: 1.1,
				stealFactor: 1.21,
				turnoverFactor: 1.06,
				orbFactor: 1.135375,
			},
			1991: {
				pace: 97.8,
				threePointers: true,
				threePointTendencyFactor: 0.214,
				threePointAccuracyFactor: 0.896,
				twoPointAccuracyFactor: 1.001,
				blockFactor: 1.1,
				stealFactor: 1.2,
				turnoverFactor: 1.06,
				orbFactor: 1.118125,
			},
			1990: {
				pace: 98.3,
				threePointers: true,
				threePointTendencyFactor: 0.199,
				threePointAccuracyFactor: 0.927,
				twoPointAccuracyFactor: 1.001,
				blockFactor: 1.1,
				stealFactor: 1.16,
				turnoverFactor: 1.06,
				orbFactor: 1.111,
			},
			1989: {
				pace: 100.6,
				threePointers: true,
				threePointTendencyFactor: 0.193,
				threePointAccuracyFactor: 0.905,
				twoPointAccuracyFactor: 1.004,
				blockFactor: 1.1,
				stealFactor: 1.2,
				turnoverFactor: 1.09,
				orbFactor: 1.1215,
			},
			1988: {
				pace: 99.6,
				threePointers: true,
				threePointTendencyFactor: 0.149,
				threePointAccuracyFactor: 0.885,
				twoPointAccuracyFactor: 1.005,
				blockFactor: 1.1,
				stealFactor: 1.12,
				turnoverFactor: 1.07,
				orbFactor: 1.118125,
			},
			1987: {
				pace: 100.8,
				threePointers: true,
				threePointTendencyFactor: 0.14,
				threePointAccuracyFactor: 0.843,
				twoPointAccuracyFactor: 1.006,
				blockFactor: 1.1,
				stealFactor: 1.08,
				turnoverFactor: 1.07,
				orbFactor: 1.128625,
			},
			1986: {
				pace: 102.1,
				threePointers: true,
				threePointTendencyFactor: 0.095,
				threePointAccuracyFactor: 0.79,
				twoPointAccuracyFactor: 1.016,
				blockFactor: 1.1,
				stealFactor: 1.06,
				turnoverFactor: 1.1,
				orbFactor: 1.10425,
			},
			1985: {
				pace: 102.1,
				threePointers: true,
				threePointTendencyFactor: 0.092,
				threePointAccuracyFactor: 0.79,
				twoPointAccuracyFactor: 1.023,
				blockFactor: 1.1,
				stealFactor: 1.03,
				turnoverFactor: 1.1,
				orbFactor: 1.107625,
			},
			1984: {
				pace: 101.4,
				threePointers: true,
				threePointTendencyFactor: 0.068,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 1.023,
				blockFactor: 1.1,
				stealFactor: 1.03,
				turnoverFactor: 1.1,
				orbFactor: 1.107625,
			},
			1983: {
				pace: 103.1,
				threePointers: true,
				threePointTendencyFactor: 0.065,
				threePointAccuracyFactor: 0.667,
				twoPointAccuracyFactor: 1.009,
				blockFactor: 1.1,
				stealFactor: 1.01,
				turnoverFactor: 1.13,
				orbFactor: 1.1215,
			},
			1982: {
				pace: 100.9,
				threePointers: true,
				threePointTendencyFactor: 0.065,
				threePointAccuracyFactor: 0.734,
				twoPointAccuracyFactor: 1.02,
				blockFactor: 1.1,
				stealFactor: 1,
				turnoverFactor: 1.1,
				orbFactor: 1.11475,
			},
			1981: {
				pace: 101.8,
				threePointers: true,
				threePointTendencyFactor: 0.06,
				threePointAccuracyFactor: 0.686,
				twoPointAccuracyFactor: 1.008,
				blockFactor: 1.1,
				stealFactor: 1.05,
				turnoverFactor: 1.13,
				orbFactor: 1.118125,
			},
			1980: {
				pace: 103.1,
				threePointers: true,
				threePointTendencyFactor: 0.08,
				threePointAccuracyFactor: 0.784,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.08,
				turnoverFactor: 1.13,
				orbFactor: 1.128625,
			},
			1979: {
				pace: 105.8,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.99575,
				blockFactor: 1.1,
				stealFactor: 1,
				turnoverFactor: 1.14,
				orbFactor: 1.111,
			},
			1978: {
				pace: 106.7,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9762,
				blockFactor: 1,
				stealFactor: 1.07,
				turnoverFactor: 1.14,
				orbFactor: 1.107625,
			},
			1977: {
				pace: 106.5,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9694,
				blockFactor: 1,
				stealFactor: 1.03,
				turnoverFactor: 1.16,
				orbFactor: 1.111,
			},
			1976: {
				pace: 105.5,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9575,
				blockFactor: 1,
				stealFactor: 0.98,
				turnoverFactor: 1.14,
				orbFactor: 1.09375,
			},
			1975: {
				pace: 104.5,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9558,
				blockFactor: 1,
				stealFactor: 0.94,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1974: {
				pace: 107.8,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.95835,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.097125,
			},
			1973: {
				pace: 110.385,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9541,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1972: {
				pace: 109.785,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9507,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1971: {
				pace: 112.988,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9507,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1970: {
				pace: 114.811,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.96005,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1969: {
				pace: 114.571,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9439,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1968: {
				pace: 117.058,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.95325,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1967: {
				pace: 119.602,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9439,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1966: {
				pace: 118.921,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.92945,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1965: {
				pace: 115.617,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.91755,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1964: {
				pace: 114.689,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.92945,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1963: {
				pace: 117.316,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9439,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1962: {
				pace: 125.168,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9269,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1961: {
				pace: 127.219,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9065,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1960: {
				pace: 126.113,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.898,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1959: {
				pace: 118.68,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8725,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1958: {
				pace: 118.564,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8521,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1957: {
				pace: 109.736,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.84615,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1956: {
				pace: 106.17,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.85805,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1955: {
				pace: 101,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8455,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1954: {
				pace: 93,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8333,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1953: {
				pace: 95,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.83,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1952: {
				pace: 97,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8232,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1951: {
				pace: 99,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 0.81,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1950: {
				pace: 99,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 0.79,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1949: {
				pace: 104,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 0.77,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1948: {
				pace: 108,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.6,
				twoPointAccuracyFactor: 0.71,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1947: {
				pace: 104,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.6,
				twoPointAccuracyFactor: 0.7,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
	  }
	: undefined;

const encodeDecodeFunctions = {
	bool: {
		stringify: (value: boolean) => String(value),
		parse: (value: string) => value === "true",
	},
	custom: {},
	float: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	float1000: {
		stringify: (value: number) => String(value / 1000),
		parse: (value: string) => {
			const parsed = parseFloat(value) * 1000;
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	floatOrNull: {
		stringify: (value: number | null) => (value === null ? "" : String(value)),
		parse: (value: string) => {
			if (value === "") {
				return null;
			}

			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	int: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseInt(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid integer`);
			}
			return parsed;
		},
	},
	intOrNull: {
		stringify: (value: number | null) => (value === null ? "" : String(value)),
		parse: (value: string) => {
			if (value === "") {
				return null;
			}

			const parsed = parseInt(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid integer`);
			}
			return parsed;
		},
	},
	string: {},
	jsonString: {
		stringify: (value: any) => JSON.stringify(value),
		parse: (value: string) => JSON.parse(value),
	},
	rangePercent: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	floatValuesOrCustom: {
		stringify: (value: number, values: Values) => {
			const stringValue = String(value);
			return JSON.stringify([
				values.every(({ key }) => key !== stringValue),
				stringValue,
			]);
		},
		parse: (value: string) => {
			const parts = JSON.parse(value);
			const numberPart = parseFloat(parts[1]);
			if (Number.isNaN(numberPart)) {
				throw new Error(`"${numberPart}" is not a valid number`);
			}
			return numberPart;
		},
	},
};

const inputStyle = {
	width: 150,
};

const Input = ({
	decoration,
	disabled,
	godModeRequired,
	id,
	maxWidth,
	onChange,
	type,
	value,
	values,
}: {
	decoration?: Decoration;
	disabled?: boolean;
	godModeRequired?: "always" | "existingLeagueOnly";
	id: string;
	maxWidth?: true;
	name: string;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	type: FieldType;
	value: string;
	values?: Values;
}) => {
	const title = disabled ? godModeRequiredMessage(godModeRequired) : undefined;
	const commonProps = {
		className: "form-control",
		disabled,
		title,
		id,
		onChange,
		style:
			!decoration &&
			type !== "rangePercent" &&
			type !== "floatValuesOrCustom" &&
			!maxWidth
				? inputStyle
				: undefined,
		value,
	};

	let inputElement;
	if (type === "bool") {
		const checked = value === "true";
		const switchTitle = title ?? (checked ? "Enabled" : "Disabled");
		inputElement = (
			<div className="custom-control custom-switch" title={switchTitle}>
				<input
					type="checkbox"
					className="custom-control-input"
					disabled={disabled}
					checked={checked}
					onChange={onChange}
					id={id}
				/>
				<label className="custom-control-label" htmlFor={id}></label>
			</div>
		);
	} else if (type === "rangePercent") {
		inputElement = (
			<div className="d-flex" style={inputStyle}>
				<div className="text-right mr-1" style={{ minWidth: 38 }}>
					{Math.round(parseFloat(value) * 100)}%
				</div>
				<div>
					<input
						type="range"
						{...commonProps}
						className="form-control-range"
						min="0"
						max="1"
						step="0.05"
					/>
				</div>
			</div>
		);
	} else if (values) {
		if (type === "floatValuesOrCustom") {
			const parsed = JSON.parse(value);
			const selectValue =
				parsed[0] || values.every(({ key }) => key !== parsed[1])
					? "custom"
					: parsed[1];
			inputElement = (
				<div className="input-group" style={inputStyle}>
					<select
						{...commonProps}
						className="form-control"
						value={selectValue}
						style={{ width: 60 }}
					>
						{values.map(({ key, value }) => (
							<option key={key} value={key}>
								{value}
							</option>
						))}
						<option value="custom">Custom</option>
					</select>
					<input
						type="text"
						className="form-control"
						disabled={selectValue !== "custom"}
						onChange={onChange}
						value={parsed[1]}
					/>
				</div>
			);
		} else {
			inputElement = (
				<select {...commonProps}>
					{values.map(({ key, value }) => (
						<option key={key} value={key}>
							{value}
						</option>
					))}
				</select>
			);
		}
	} else {
		inputElement = <input type="text" {...commonProps} />;
	}

	if (decoration === "currency") {
		return (
			<div className="input-group" style={inputStyle}>
				<div className="input-group-prepend">
					<div className="input-group-text">$</div>
				</div>
				{inputElement}
				<div className="input-group-append">
					<div className="input-group-text">M</div>
				</div>
			</div>
		);
	}

	if (decoration === "percent") {
		return (
			<div className="input-group" style={inputStyle}>
				{inputElement}
				<div className="input-group-append">
					<div className="input-group-text">%</div>
				</div>
			</div>
		);
	}

	return inputElement;
};

Input.propTypes = {
	decoration: PropTypes.oneOf(["currency", "percent"]),
	disabled: PropTypes.bool,
	onChange: PropTypes.func.isRequired,
	type: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	values: PropTypes.array,
};

const Option = ({
	id,
	disabled,
	name,
	description,
	descriptionLong,
	decoration,
	godModeRequired,
	newLeague,
	maxWidth,
	onChange,
	type,
	value,
	values,
	customForm,
}: {
	id: string;
	disabled: boolean;
	name: string;
	description?: ReactNode;
	descriptionLong?: ReactNode;
	decoration?: Decoration;
	godModeRequired?: "always" | "existingLeagueOnly";
	newLeague?: boolean;
	maxWidth?: true;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	type: FieldType;
	value: unknown;
	values?: Values;
	customForm?: ReactNode;
}) => {
	const [showDescriptionLong, setShowDescriptionLong] = useState(false);

	let formElement;
	if (customForm) {
		formElement = customForm;
	} else {
		if (typeof value !== "string") {
			throw new Error("Value must be string");
		}
		formElement = (
			<Input
				type={type}
				disabled={disabled}
				godModeRequired={godModeRequired}
				id={id}
				maxWidth={maxWidth}
				name={name}
				onChange={onChange}
				value={value}
				values={values}
				decoration={decoration}
			/>
		);
	}

	return (
		<>
			<div className="d-flex align-items-center" style={{ minHeight: 33 }}>
				<div className="mr-auto text-nowrap">
					<label
						className="mb-0"
						htmlFor={id}
						onClick={event => {
							// Don't toggle on label click, too confusing
							if (type === "bool") {
								event.preventDefault();
							}
						}}
					>
						{settingNeedsGodMode(godModeRequired, newLeague) ? (
							<span
								className="legend-square god-mode mr-1"
								title={godModeRequiredMessage(godModeRequired)}
							/>
						) : null}
						{name.endsWith(" Factor") ? (
							<>
								{name.replace(" Factor", "")}
								<span className="d-none d-lg-inline"> Factor</span>
							</>
						) : (
							name
						)}
					</label>
					{descriptionLong ? (
						<span
							className="ml-1 glyphicon glyphicon-question-sign help-icon"
							onClick={() => {
								setShowDescriptionLong(show => !show);
							}}
						/>
					) : null}
				</div>
				<div className={classNames("ml-auto", maxWidth ? "w-100" : undefined)}>
					{formElement}
				</div>
			</div>
			{description ? (
				<div className="text-muted settings-description mt-1">
					{description}
				</div>
			) : null}
			<AnimatePresence initial={false}>
				{showDescriptionLong ? (
					<m.div
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={{
							open: { opacity: 1, height: "auto" },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{
							duration: 0.3,
							type: "tween",
						}}
						className="text-muted settings-description mt-1"
					>
						{descriptionLong}
					</m.div>
				) : null}
			</AnimatePresence>
		</>
	);
};

const GodModeSettingsButton = ({
	children,
	className,
	godMode,
	disabled,
	onClick,
}: {
	children: any;
	className?: string;
	godMode: boolean;
	disabled?: boolean;
	onClick: () => void;
}) => {
	if (godMode) {
		return null;
	}

	return (
		<button
			type="button"
			className={classNames("btn btn-secondary", className)}
			disabled={disabled}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

const SPECIAL_STATE_OTHERS = ["injuries"] as const;
const SPECIAL_STATE_BOOLEANS = ["godMode", "godModeInPast"] as const;
const SPECIAL_STATE_ALL = [...SPECIAL_STATE_BOOLEANS, ...SPECIAL_STATE_OTHERS];
type SpecialStateBoolean = typeof SPECIAL_STATE_BOOLEANS[number];
type SpecialStateAll = typeof SPECIAL_STATE_ALL[number];

type State = Record<Exclude<Key, SpecialStateAll>, string> &
	Record<SpecialStateBoolean, boolean> &
	Record<"injuries", InjuriesSetting>;

const SettingsForm = ({
	onCancel,
	onSave,
	hasPlayers,
	newLeague,
	realPlayers,
	saveText = "Save Settings",
	...props
}: Settings & {
	onCancel?: () => void;
	onSave: (settings: Settings) => void;
	hasPlayers?: boolean;
	newLeague?: boolean;
	realPlayers?: boolean;
	saveText?: string;
}) => {
	const [showGodModeSettings, setShowGodModeSettings] = useState(true);

	useEffect(() => {
		localActions.update({
			stickyFormButtons: true,
		});

		return () => {
			localActions.update({
				stickyFormButtons: false,
			});
		};
	});

	const [submitting, setSubmitting] = useState(false);
	const [gameSimPreset, setGameSimPreset] = useState("default");
	const [state, setState] = useState<State>(() => {
		// @ts-ignore
		const initialState: State = {};
		for (const { key, type, values } of settings) {
			if (SPECIAL_STATE_ALL.includes(key as any)) {
				continue;
			}

			const value = props[key];

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			const stringify = encodeDecodeFunctions[type].stringify;

			initialState[key] = stringify ? stringify(value, values) : value;
		}

		for (const key of SPECIAL_STATE_BOOLEANS) {
			initialState[key] = props[key];
		}
		initialState.injuries = props.injuries;

		return initialState;
	});
	const godMode = !!state.godMode;

	const handleGodModeToggle = async () => {
		let proceed: any = true;
		if (!state.godMode && !state.godModeInPast && !props.godModeInPast) {
			proceed = await confirm(
				"God Mode enables tons of customization features, including many of the settings found here. But if you ever enable God Mode in a league, you will not be awarded any achievements in that league, even if you disable God Mode.",
				{
					okText: "Enable God Mode",
				},
			);
		}

		if (proceed) {
			if (state.godMode) {
				setState(prevState => ({
					...prevState,
					godMode: false,
				}));
			} else {
				setState(prevState => ({
					...prevState,
					godMode: true,
					godModeInPast: true,
				}));
			}
		}
	};

	const handleChange =
		(name: Key, type: FieldType) =>
		(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			let value: string;
			if (type === "bool") {
				value = String((event.target as any).checked);
			} else if (type === "floatValuesOrCustom") {
				if (event.target.value === "custom") {
					const raw = state[name];
					if (typeof raw !== "string") {
						throw new Error("Invalid value");
					}

					value = JSON.stringify([true, JSON.parse(raw)[1]]);
				} else {
					value = JSON.stringify([false, event.target.value]);
				}
			} else {
				value = event.target.value;
			}

			setState(prevState => ({
				...prevState,
				[name]: value,
			}));

			if (gameSimPresets && Object.keys(gameSimPresets[2020]).includes(name)) {
				setGameSimPreset("default");
			}
		};

	// Filter out the new league only ones when appropriate
	const filteredSettings = settings.filter(setting => {
		return (
			!setting.showOnlyIf ||
			setting.showOnlyIf({
				hasPlayers,
				newLeague,
				realPlayers,
			})
		);
	});
	const groupedSettings = groupBy(filteredSettings, "category");

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setSubmitting(true);

		const output = {} as unknown as Settings;
		for (const option of filteredSettings) {
			const { key, name, type } = option;
			const value = state[key];

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			const parse = encodeDecodeFunctions[type].parse;

			try {
				// @ts-ignore
				output[key] = parse ? parse(value) : value;
			} catch (error) {
				setSubmitting(false);
				logEvent({
					type: "error",
					text: `${name}: ${error.message}`,
					saveToDb: false,
					persistent: true,
				});
				return;
			}
		}

		for (const key of SPECIAL_STATE_BOOLEANS) {
			output[key] = state[key];
		}

		// Run validation functions at the end, so all values are available
		for (const option of filteredSettings) {
			const { key, name, validator } = option;
			try {
				if (validator) {
					await validator(output[key], output, props);
				}
			} catch (error) {
				setSubmitting(false);
				logEvent({
					type: "error",
					text: `${name}: ${error.message}`,
					saveToDb: false,
					persistent: true,
				});
				return;
			}
		}

		try {
			await onSave(output);
		} catch (error) {
			console.error(error);
			setSubmitting(false);
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			return;
		}

		setSubmitting(false);
	};

	const currentCategoryNames: Category[] = [];

	const toggleGodModeSettings = () => {
		setShowGodModeSettings(show => !show);
	};

	const settingIsEnabled = (
		godModeRequired?: "always" | "existingLeagueOnly",
	) => {
		return godMode || !settingNeedsGodMode(godModeRequired, newLeague);
	};

	// Specified order
	const categories: {
		name: Category;
		helpText?: ReactNode;
	}[] = [
		{
			name: "New League",
		},
		{
			name: "General",
		},
		{
			name: "Schedule",
			helpText: (
				<>
					<p>
						Changing these settings will only apply to the current season if the
						regular season or playoffs have not started yet. Otherwise, changes
						will be applied for next year. If you are in the regular season and
						have not yet played a game yet, you can regenerate the current
						schedule in the{" "}
						<a href={helpers.leagueUrl(["danger_zone"])}>Danger Zone</a>.
					</p>
					<p>
						The schedule is set by first accounting for "# Division Games" and
						"# Conference Games" for each team. Then, remaining games are filled
						with any remaining teams (non-conference teams, plus maybe division
						and conference teams if one of those settings is left blank).
					</p>
				</>
			),
		},
		{
			name: "Standings",
		},
		{
			name: "Team",
		},
		{
			name: "Draft",
		},
		{
			name: "Finances",
		},
		{
			name: "Inflation",
			helpText: (
				<>
					<p>
						This lets you randomly change your league's financial settings
						(salary cap, min payroll, luxury tax payroll, min contract, max
						contract) every year before the draft. It works by picking a{" "}
						<a
							href="https://en.wikipedia.org/wiki/Truncated_normal_distribution"
							rel="noopener noreferrer"
							target="_blank"
						>
							truncated Gaussian random number
						</a>{" "}
						based on the parameters set below (min, max, average, and standard
						deviation).
					</p>
					{isSport("basketball") ? (
						<p>
							If you have any scheduled events containing specific finance
							changes then these settings will be ignored until all those
							scheduled events have been processed. Basically this means that
							for historical real players leagues, these inflation settings will
							only take effect once your league moves into the future.
						</p>
					) : null}
				</>
			),
		},
		{
			name: "Contracts",
		},
		{
			name: "Events",
		},
		{
			name: "Injuries",
		},
		{
			name: "Game Simulation",
		},
		{
			name: "Elam Ending",
			helpText: (
				<>
					<p>
						The{" "}
						<a
							href="https://thetournament.com/elam-ending"
							rel="noopener noreferrer"
							target="_blank"
						>
							Elam Ending
						</a>{" "}
						is a new way to play the end of basketball games. In the final
						period of the game, when the clock goes below a certain point
						("Minutes Left Trigger"), the clock is turned off. The winner of the
						game will be the team that first hits a target score. That target is
						determined by adding some number of points ("Target Points to Add")
						to the leader's current score.
					</p>
					<p>
						By default, the trigger is 4 minutes remaining and the target points
						to add is 8.
					</p>
					<p>
						The Elam Ending generally makes the end of the game more exciting.
						Nobody is trying to run out the clock. Nobody is trying to foul or
						call strategic timeouts or rush shots. It's just high quality
						basketball, every play until the end of the game.
					</p>
				</>
			),
		},
		{
			name: "Challenge Modes",
		},
		{
			name: "Game Modes",
		},
		{
			name: "Player Development",
		},
		{
			name: "UI",
		},
	];

	return (
		<div className="settings-wrapper mt-lg-2">
			<form onSubmit={handleFormSubmit} style={{ maxWidth: 2100 }}>
				<GodModeSettingsButton
					className="mb-5 d-sm-none"
					godMode={godMode}
					disabled={submitting}
					onClick={toggleGodModeSettings}
				>
					{showGodModeSettings ? "Hide" : "Show"} God Mode Settings
				</GodModeSettingsButton>

				{categories.map(category => {
					if (!groupedSettings[category.name]) {
						return null;
					}

					const catOptions = groupedSettings[category.name].filter(option => {
						return (
							(showGodModeSettings ||
								settingIsEnabled(option.godModeRequired)) &&
							!option.hidden
						);
					});

					if (catOptions.length === 0) {
						return null;
					}
					currentCategoryNames.push(category.name);

					return (
						<Fragment key={category.name}>
							<a className="anchor" id={category.name} />
							<h2 className="mb-3">
								{category.name}
								{category.helpText ? (
									<HelpPopover title={category.name} className="ml-1">
										{category.helpText}
									</HelpPopover>
								) : null}
							</h2>
							{category.name === "Game Simulation" &&
							isSport("basketball") &&
							gameSimPresets &&
							(godMode || showGodModeSettings) ? (
								<div className="form-inline mb-3">
									<select
										className="form-control"
										value={gameSimPreset}
										disabled={!godMode}
										onChange={event => {
											// @ts-ignore
											const presets = gameSimPresets[event.target.value];
											if (!presets) {
												return;
											}

											const presetsString: any = {};
											for (const [key, value] of Object.entries(presets)) {
												presetsString[key] = String(value);
											}

											setState(prevState => ({
												...prevState,
												...presetsString,
											}));
											setGameSimPreset(event.target.value);
										}}
									>
										<option value="default">
											Select preset based on historical NBA stats
										</option>
										{Object.keys(gameSimPresets)
											.sort()
											.reverse()
											.map(season => (
												<option key={season} value={season}>
													{season}
												</option>
											))}
									</select>
								</div>
							) : null}
							<div className="row mb-5 mb-md-3">
								{catOptions.map(
									(
										{
											customForm,
											decoration,
											description,
											descriptionLong,
											godModeRequired,
											key,
											maxWidth,
											name,
											type,
											values,
										},
										i,
									) => {
										const enabled = settingIsEnabled(godModeRequired);
										const id = `settings-${category.name}-${name}`;

										let customFormNode;
										if (customForm) {
											if (key === "stopOnInjuryGames") {
												const key2 = "stopOnInjury";
												const checked = state[key2] === "true";
												customFormNode = (
													<div
														style={inputStyle}
														className="d-flex align-items-center"
													>
														<div
															className="custom-control custom-switch"
															title={checked ? "Enabled" : "Disabled"}
														>
															<input
																type="checkbox"
																className="custom-control-input"
																checked={checked}
																disabled={!enabled || submitting}
																onChange={handleChange(key2, "bool")}
																id={id + "2"}
																value={state[key2]}
															/>
															<label
																className="custom-control-label"
																htmlFor={id + "2"}
															></label>
														</div>
														<div className="input-group">
															<input
																id={id}
																disabled={!checked || !enabled || submitting}
																className="form-control"
																type="text"
																onChange={handleChange(key, type)}
																value={state[key]}
															/>
															<div className="input-group-append">
																<div className="input-group-text">Games</div>
															</div>
														</div>
													</div>
												);
											} else if (key === "injuries") {
												customFormNode = (
													<Injuries
														defaultValue={state.injuries}
														disabled={!enabled || submitting}
														godModeRequired={godModeRequired}
														onChange={injuries => {
															setState(prevState => ({
																...prevState,
																injuries,
															}));
														}}
													/>
												);
											}
										}

										return (
											<div
												key={key}
												className="settings-col col-md-6 col-xxl-4 d-flex"
											>
												<div
													className={classNames(
														"fake-list-group-item rounded",
														{
															"settings-striped-bg-alt": i % 2 === 1,
														},
													)}
												>
													<Option
														type={type}
														disabled={!enabled || submitting}
														id={id}
														onChange={handleChange(key, type)}
														value={state[key]}
														values={values}
														decoration={decoration}
														name={name}
														description={description}
														descriptionLong={descriptionLong}
														customForm={customFormNode}
														maxWidth={maxWidth}
														godModeRequired={godModeRequired}
														newLeague={newLeague}
													/>
												</div>
											</div>
										);
									},
								)}
							</div>
						</Fragment>
					);
				})}

				<StickyBottomButtons>
					<div className="btn-group">
						<button
							className={classNames(
								"btn border-0",
								godMode ? "btn-secondary" : "btn-god-mode",
							)}
							onClick={handleGodModeToggle}
							type="button"
							disabled={submitting}
						>
							{godMode ? "Disable God Mode" : "Enable God Mode"}
						</button>
						{!godMode ? (
							<GodModeSettingsButton
								className="d-none d-sm-block"
								godMode={godMode}
								disabled={submitting}
								onClick={toggleGodModeSettings}
							>
								{showGodModeSettings ? "Hide" : "Show"} God Mode settings
							</GodModeSettingsButton>
						) : null}
					</div>
					<div className="btn-group ml-auto">
						{onCancel ? (
							<button
								className="btn btn-secondary"
								type="button"
								disabled={submitting}
								onClick={onCancel}
							>
								Cancel
							</button>
						) : null}
						<ActionButton
							type="submit"
							disabled={submitting}
							processing={!!newLeague && submitting}
						>
							{saveText}
						</ActionButton>
					</div>
				</StickyBottomButtons>
			</form>
			<div className="settings-shortcuts flex-shrink-0">
				<ul className="list-unstyled">
					<li>Shortcuts: </li>
					{currentCategoryNames.map(name => (
						<li key={name} className="settings-shortcut">
							<a href={`#${name}`}>{name}</a>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

SettingsForm.propTypes = {
	godMode: PropTypes.bool.isRequired,
	godModeInPast: PropTypes.bool.isRequired,
	luxuryPayroll: PropTypes.number.isRequired,
	luxuryTax: PropTypes.number.isRequired,
	maxContract: PropTypes.number.isRequired,
	minContract: PropTypes.number.isRequired,
	minPayroll: PropTypes.number.isRequired,
	minRosterSize: PropTypes.number.isRequired,
	maxRosterSize: PropTypes.number.isRequired,
	numActiveTeams: PropTypes.number.isRequired,
	numGames: PropTypes.number.isRequired,
	quarterLength: PropTypes.number.isRequired,
	salaryCap: PropTypes.number.isRequired,
	aiTradesFactor: PropTypes.number.isRequired,
	injuryRate: PropTypes.number.isRequired,
	tragicDeathRate: PropTypes.number.isRequired,
	brotherRate: PropTypes.number.isRequired,
	homeCourtAdvantage: PropTypes.number.isRequired,
	rookieContractLengths: PropTypes.arrayOf(PropTypes.number).isRequired,
	sonRate: PropTypes.number.isRequired,
	hardCap: PropTypes.bool.isRequired,
	numGamesPlayoffSeries: PropTypes.arrayOf(PropTypes.number).isRequired,
	numPlayoffByes: PropTypes.number.isRequired,
	draftType: PropTypes.string.isRequired,
	playersRefuseToNegotiate: PropTypes.bool.isRequired,
	budget: PropTypes.bool.isRequired,
	numSeasonsFutureDraftPicks: PropTypes.number.isRequired,
	foulRateFactor: PropTypes.number.isRequired,
	foulsNeededToFoulOut: PropTypes.number.isRequired,
	foulsUntilBonus: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default SettingsForm;
