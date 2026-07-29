hey everyone, my name's Harshit Mangtani and here's my walkthrough for the submission of frontend technical assessment.

I made the app with react, typescript, reat flow and python/fastapi for backend. (add other things used)

So for the first task let's talk about node abstraction, we got 4 base nodes and adeed 5 mor eof our own. each one has diffent types of input, outputs, buttons, actions, toggles, etc. (give an overvirew of features)
then talk about what code files to show 

let's walk through the ui, I started off with a glassmorphic kind of approach then came across a demo of actual company product on youtube, and tried to move closer to that. the design's reponsive and mobile-friendly as well

so here's the side rail with all nodes present, we can hover to expand/collapse, also got a pin button to keep it expanded. We can click to add or drag/drop onto the canvas. on mobile the we get buttons to expand/collpase instaed of hover.

here's the connections button to toggle between straight/curved lines, then we have this actions abr with the option to zomm-in/out, fit view, lock positions and a minimap of the canvas as well.

we have the clear all buttons to clear all nodes and connections when clicked along with a confirmation dialogue, and next to it is the submit button to send info to backend for calculation of no. of node, edges, DAG verdict. on clicking the submit button, the screen is in loaiding state so other actions like clear all can be avoided.

then we'll build the demo pipeline with exact changes to be done in each node

apart from this some tests and documentatoin aslo present in codebase