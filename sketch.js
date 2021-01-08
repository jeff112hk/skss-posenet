// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let video;
let poseNet;
let poses = [];
let stage = 0;
let stageResult = [0, 0]
let poseOffset = 30
let confidenceOffset = 0.1
let stopCounting = false

let currentFrame = 0
let delayFrame = 40

let page = 0;

let imgLogo;
let imgO;
let imgStar;
let radio = 640 / 480

// function preload() {
//   imgLogo = loadImage('assets/logo.png');
//   imgO = loadImage('assets/o.png');
//   imgStar = loadImage('assets/star.png');
// }

function setUpStepDetail() {
    let stepDetail = document.getElementById('actionDetails');
    switch (String(stage)) {
        case '0':
            stepDetail.innerHTML = "先提起右腿，然後放下；再提起左腿，然後放下，共提腿8次"
            break;
        case '1':
            stepDetail.innerHTML = "重複第1組動作，先提起右腿，然後放下；再提起左腿，然後放下；每次提腿時，雙手同時推向前面上方，共8次。"
            break;
        case '2':
            stepDetail.innerHTML = "先提右腿，再提左腿，雙手同時輪流在左方和右方拍掌，共8次。"
            break;
        case '3':
            stepDetail.innerHTML = "重複第1組動作，先提起右腿，然後放下；再提起左腿，然後放下；每次提腿時，提腿稍高，雙手同時在腿下拍掌，共8次。"
            break;
        case '4':
            stepDetail.innerHTML = "腰背略為離開椅背，兩臂屈曲，指尖向上，手肘提高至胸前，然後手肘向兩側張開再收回，共8次。"
            break;
        default:
            break;
    }
}

function setup() {
    stage = sessionStorage.getItem('step');
    // console.log(step)
    if (stage == null) {
        //return home
        window.location.href = "./home.html";
        return
    }

    setUpStepDetail()
    sessionStorage.setItem('resultStep' + String(stage), stageResult);

    parWidth = document.getElementById('mainContainer').clientWidth
    cnv = createCanvas(parWidth, parWidth / radio);
    cnv.parent('canvas');
    video = createCapture(VIDEO);
    video.size(width, height);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on('pose', function(results) {
        poses = results;
    });
    // Hide the video element, and just show the canvas
    video.hide();
}

function windowResized() {
    parWidth = document.getElementById('mainContainer').clientWidth
    resizeCanvas(parWidth, parWidth / radio);
}

function modelReady() {
    select('#status').html('Model Loaded');
}

function draw() {
    image(video, 0, 0, width, height);

    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
    if (!stopCounting) {
        countMovement();
    } else {
        if (frameCount - currentFrame > delayFrame) {
            stopCounting = false;
        }
    }
    textSize(32);
    text("Stage: " + String(parseInt(stage) + 1), 25, 30);
    text("Count: " + stageResult[0] + ", " + stageResult[1], 25, 70);

    // switch (page){
    //   case 0:
    //     loadingScreen();
    //     break;
    //   default:
    //     break;
    // }
}

function countMovement() {
    // console.log(poses);
    let record0 = stageResult[0];
    let record1 = stageResult[1];

    for (let i = 0; i < poses.length; i++) {
        let pose = poses[i].pose;
        let leftKnee = pose.leftKnee;
        let rightKnee = pose.rightKnee;
        let leftWrist = pose.leftWrist;
        let leftElbow = pose.leftElbow;
        let rightWrist = pose.rightWrist;
        let rightElbow = pose.rightElbow;

        switch (String(stage)) {
            case '0':
            case '1':
                if (leftKnee.confidence < confidenceOffset || rightKnee.confidence < confidenceOffset) {
                    break;
                }
                if (rightKnee.y > leftKnee.y + poseOffset) {
                    stageResult[0] += 1
                } else if (leftKnee.y > rightKnee.y + poseOffset) {
                    stageResult[1] += 1
                }
                break;
            case '2':
            case '4':
                if (leftWrist.y > leftElbow.y + poseOffset && leftWrist.confidence > confidenceOffset && leftElbow.confidence > confidenceOffset) {
                    stageResult[0] += 1
                } else if (rightWrist.y > rightElbow.y + poseOffset && rightWrist.confidence > confidenceOffset && rightElbow.confidence > confidenceOffset) {
                    stageResult[1] += 1
                }
                break;
            case '3':
                if (leftKnee.y > leftElbow.y + poseOffset && leftKnee.confidence > confidenceOffset && leftElbow.confidence > confidenceOffset) {
                    stageResult[0] += 1
                } else if (leftWrist.y > rightElbow.y + poseOffset && rightKnee.confidence > confidenceOffset && rightElbow.confidence > confidenceOffset) {
                    stageResult[1] += 1
                }
                break;
            default:
                break;
        }

        //Count only one person;
        break;
    }
    // console.log(stageResult[0], stageResult[1])
    if (record0 != stageResult[0] || record1 != stageResult[1]) {
        stopCounting = true;
        currentFrame = frameCount;
        sessionStorage.setItem('resultStep' + String(stage), stageResult);
    }

    //testing 
    // if (stageResult[0] >= 8 && stageResult[1] >= 8) {
    //     stageResult = [0, 0]
    //     stage += 1
    // }
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}