<?php
$file = "counter.txt";

// Read current count
$count = file_exists($file) ? (int)file_get_contents($file) : 0;

// Increase count
$count++;

// Save it back
file_put_contents($file, $count);

// Output for JavaScript
echo $count;
