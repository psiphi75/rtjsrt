/*********************************************************************
 *                                                                   *
 *   Copyright 2016 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

const vector = require('./vector');

const constants = {

    // Used to make sure we are on the near side of point of intersection
    EPSILON: 0.00001,

    // Canvas size
    WIDTH: 700,
    HEIGHT: 700,

    // How big a grid size to use for checking contents (in pixels)
    CONTENT_SIZE: 8,

    // Named Colours
    COL_WHITE: vector.make(1, 1, 1),
    COL_RED: vector.make(1, 0, 0),
    COL_GREEN: vector.make(0, 1, 0),
    COL_BLUE: vector.make(0.6, 1, 1),
    COL_SILVER: vector.make(0.85, 0.85, 0.85),

    // Colours of objects/scene
    COL_SQUARE_1: vector.make(0, 0, 0),
    COL_SQUARE_2: vector.make(0, 0.5, 0),
    COL_BACKGROUND: vector.make(0, 0, 0),

    // Where the ground plane sits
    GROUND_PLANE: vector.make(0, 0, 0)
};

module.exports = constants;
