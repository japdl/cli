# Japdl
Japdl est un programme pour télécharger les mangas de japscan. Pour l'instant, il n'est pas possible de télécharger les webtoons.

## Téléchargement
[Par ici pour la dernière version](https://github.com/Seysa/japdl/releases "Dernière version")

## Installation
Dézipper l'archive `japdl.zip` téléchargée. Vous trouverez à l'intérieur `japdl.exe` qui est l'essentiel du programme.

Le programme n'a besoin que de chrome/chromium/edge pour fonctionner et peut se mettre n'importe où. Si le programme ne trouve pas votre chrome/chromium/edge,
il faut lui donner dans un fichier `config.txt` placé à côté de `japdl.exe`. Un prototype de `config.txt` est donné dans `japdl.zip`.

## Lancement avec options
Cette section n'est pas nécessaire au bon fonctionnement du programme.

Le programme peut se lancer avec des options, permettant d'activer des options spécifiques. Pour l'instant, les options sont:

1. `-h | --headless` : Permet de voir le navigateur télécharger en direct sur japscan. Par défaut, le navigateur est caché.
2. `-v | --verbose` : Permet d'avoir plus de messages dans la console pour mieux comprendre le fonctionnement.
3. `-f | --fast` : Permet de télécharger simultanément tous les chapitres d'un volume. Cette option est déconseillée, car des images peuvent être sautées si l'image prend plus de 60 secondes à charger. Pour l'utiliser correctement, il est nécessaire d'avoir une bonne connexion et un ordinateur très rapide.

Il est possible de cumuler plusieurs flags sur le même tiret. L'ordre des flags n'a alors pas d'importance.

Exemples:
- `japdl.exe -h`
- `japdl.exe -vhf`
- `japdl.exe --verbose --headless`

Sur windows, il est possible de spécifier ces flags dans les propriétés d'un raccourci vers l'executable de japdl. Il suffit de placer après le chemin dans "Cible" les flags.

## Pour les developpeurs
### Compiler le programme depuis les sources
```
npm install
tsc
```
### Puis le lancer
Attention, une version de node 14 est nécessaire.
```
node .
```
