# dxtionary `/ˈdɪkʃ(ə)n(ə)ɹi/` README

Lookup a german word without changing your writing context.

## Features

* Lookup a word from German-English dictionary `de-en-dev.txt` from https://www-user.tu-chemnitz.de/~fri/ding/

![Screenshot](./doc/Screenshot_demo.png)

## Usage

* After you install this Extension, you must extract the Ding-dictionary in
`${globalStoragePath}`. To do this, just try to lookup a word (S. below). This extension
will show a message with an extract button, just click it and wait for some seconds (or maybe some minutes).

* To lookup a word by typing it from keyboard: 

    - Launch VS Code Quick Open (<kbd>Ctrl</kbd>+<kbd>p</kbd>)
    - → Type `dxtionary.lookup.ui`
    - → Type your word to lookup

* To lookup a word from an open document: use shortcut <kbd>Ctrl</kbd>+<kbd>e</kbd>` to trigger the 
    command `dxtionary.lookup.cursor`. It should open the dictionary automatically. S. [#Known Issues] Nr 4.


## Extension Files

This extension puts the following file (except itself) in your computer:

* This extension will extract a dictionary in the directory `${globalStoragePath}/hpb-htw.dxtionary`. In Linux it could be `${HOME}/.config/Code/User/globalStorage/hpb-htw.dxtionary`.


## Known Issues

1. This extension is slow!
2. The dictionary  cannot find plural form  in occasionally cases, where the plural form is not found directly 
   after singular form.
3. This extension use NeDB as database, so it consums a relative large amount of memory. I would use SQLite for this but
   then this extension is not portable.   
4. When the dictionary is triggert for the first time (once per session), it shows a curious message "Kein Wort zum Nachschlagen"
   or something like that, just ignore it and presse <kbd>Ctrl</kbd>+<kbd>e</kbd> again to let the dictionary lookup your word.
5. Because the dictionary file does not contain Genitive Form of nouns, this extension cannot show Deklination with correct Genitiv. They are marked with a red „s“.