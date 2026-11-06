# Prefix each added and context line of a unified diff with its line number
# in the new file. Removed lines get blank padding. Models count hunk lines
# badly, so the reviewers read the line numbers instead of counting.
# File headers occur only between "diff --git" and the first hunk, so an
# added line "+++ x" or a removed line "--- x" inside a hunk stays a hunk line.
/^diff --git / { inhunk = 0; print; next }
/^@@/ { inhunk = 1; split($3, a, /[+,]/); n = a[2]; print; next }
!inhunk { print; next }
/^-/ { printf "     %s\n", $0; next }
/^[+ ]/ { printf "%4d %s\n", n++, $0; next }
{ print }
