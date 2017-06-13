// This .bat file makes it easy to run the JavaScript file
// It launches NodeJS with the itemfusion.js file

@echo off			
title NodeJS hook - Fusion	// Title
node %~dp0itemfusion.js		// '%~dp0' current path + 'jscript.js'

echo End of program.
pause