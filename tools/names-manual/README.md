Most of the names in the game come from real athletes. However for some countries that results in a very small list of names, which is not satisfying. So in this folder there are some additional names that will be added to the existing built-in names. They may not be perfectly representative. If you think you can do better, feel free to try!

To add a new country, make two files named country-Name-first.csv and country-Name-last.csv. These are CSV files containing two columns, Name and Frequency. Name is the name (first name or last name, depending on the file) and frequency is the relative popularity of the name. So if you have:

    Name,Frequency
    Bob,1
    Sam,5
    Carl,4

That means Sam will be 5x as common as Bob, and Carl will be 4x as common as Bob.

If you don't know what values you should use for frequency, that's fine. Make them all 1 and they'll all be equal - it's better than nothing. Or set some based on your best guess - still better than nothing.

For names that are used in multiple countries (like Hispanic names) do the same thing, except replace "country" in the filename with "group".

Except possibly for very large countries, anything more than 500 names is excessive. This is just to keep file size down, since this is a web-based game.

See the CSV files in this directory for examples.
