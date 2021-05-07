# Japdl
Japdl est un programme pour télécharger les mangas de japscan. Pour l'instant, il n'est pas possible de télécharger les webtoons.

## Téléchargement
[Par ici pour la dernière version](https://github.com/Seysa/japdl/releases "Dernière version")

## Installation
Dézipper l'archive `japdl` téléchargée. Vous trouverez à l'intérieur `japdl-win.exe` sur windows et `japdl-linux`.

Le programme n'a besoin que de chrome/chromium/edge pour fonctionner. Si vous avez téléchargé la version normale (avec chrome), le programme devrait marcher sans installation supplémentaire.

Si vous avez téléchargé l'autre version ou que vous ne voulez plus de chrome (dans le dossier .local-chromium/), alors vous pouvez spécifier le chemin de votre chrome dans un fichier `config.txt`.
il faut lui donner dans un fichier `config.txt` placé à côté du programme `japdl`.
Un exemple de `config.txt`:
```txt
# Les commentaires s'écrivent avec un '#' devant
# Ici, le chemin vers l'éxecutable de chrome/chromium/edge
chrome_path=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
# Là, nous avons l'endroit où le programme va enregistrer les mangas téléchargés
# (le chemin peut être absolu ou relatif)
output_dir=manga
```

## Lancement avec options
Cette section n'est pas nécessaire au bon fonctionnement du programme.

Le programme peut se lancer avec des options, permettant d'activer des options spécifiques. Pour l'instant, les options sont:

1. `-h | --headless` : Permet de voir le navigateur télécharger en direct sur japscan. Par défaut, le navigateur est caché.
2. `-v | --verbose` : Permet d'avoir plus de messages dans la console pour mieux comprendre le fonctionnement.
3. `-f | --fast` : Permet de télécharger simultanément tous les chapitres d'un volume. Cette option est déconseillée, car des images peuvent être sautées si l'image prend plus de 60 secondes à charger. Pour l'utiliser correctement, il est nécessaire d'avoir une bonne connexion et un ordinateur très rapide.
4. `-t | --timeout`: Permet de changer le temps (en secondes) que met le programme à décider qu'il n'y a pas d'image sur une page. Si votre connexion est très lente, les 60 secondes de base peuvent ne pas être suffisantes. Ce flag permet de changer cette durée.

Il est possible de cumuler plusieurs flags sur le même tiret. L'ordre des flags n'a alors pas d'importance.

Exemples (dans un terminal):
- `japdl -h`
- `japdl -vhf`
- `japdl --verbose --headless`
- `japdl -t=120`
- `japdl --timeout 150`

Sur Windows, il est possible de spécifier ces flags dans les propriétés d'un raccourci vers l'executable de japdl. Il suffit de placer après le chemin dans "Cible" les flags.

Sur Linux et Mac, il suffit d'écrire ces flags après le nom du programme dans le terminal pendant le lancement.

## Pour les developpeurs
### Compiler le programme depuis les sources
```
npm install
npm run download
```
### Puis le lancer
Attention, une version de node 14 est nécessaire.
```
npm start
```
