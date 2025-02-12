# Gløgg

A declarative language, for a civilized age. Code is inspired by logic languages like Datalog and Eve, and makes you store code in a SQLite database. This particular implementation generates JavaScript, but
since the AST is stored in a relational database, adding different backends should be relatively easy.

_This is a proof of concept. This language was the result of a week-long personal hackaton. It has bugs. It has lots of missing features. Finishing this language is left as an excercize for the reader._

## What does it look like?

```
commit:
  [ #duck name: "Scrooge" ]
  [ #duck name: "Donald" uncle: "Scrooge" ]
  [ #duck name: "Hewie" uncle: "Donald" ]
  [ #duck name: "Dewie" uncle: "Donald" ]
  [ #duck name: "Louie" uncle: "Donald" ]

search:
  [ #duck name: name uncle: "Donald" ]
commit @stdio:
  [ #log message: name ]
```

Here, we have two code blocks.

The first is an unconditional commit that defines five ducks and their relation to each other.
Do note that Gløgg is a dynamicly typed language. Claiming that something is a `duck` does not
restrict the fields or values that can be placed in a record.

The second block, starting with `search:`, is a conditional commit. This block commits a message
to the `stdio` context table for every duck that has `uncle: "Donald"`.

Code blocks, or queries, are kept up-to-date. If a new duck with `uncle: "Donald"` was added
during the runtime of the program, it too would be printed to the terminal.

## Tutorial

Once you have Gløgg installed on your system, you can start a new project with `glg init`.

This will create a `app.glogg.db` file in your current directory. All of the code for your program
will be stored in this database file, which is just a SQLite database.

There are a couple of benefits with this approach:

1. Since we store code, not text, code will be consistently formatted without requiring external tools.
2. Code is easily available. Tools for refactoring, visualizing, code generation, linting etc. can easily be made
   in any language that can connect to a SQLite database (which is most of them).
3. Code is stored in a validated state. "Compiling" is fast because most of the work is already done.

If you want to store your Gløgg project in Git, we recommend running `glg git init`. This will teach Git about
Gløgg, which means `git diff` will work like you're used to. We currently don't have anything fancy for git merges
or conflicts, as we haven't had time to implement it.

To actually write code, run `glg edit`.

This will read all the code from `app.glogg.db`, save it as text in a temporary file and open it in your default editor.

Any changes you make to this file is compiled and saved to the database once you save and quit your editor.

On syntax or validation error, you'll receive an error message and your invalid code is stored in a `draft.glogg` file.
Running `glg edit` again will open this file.

In the future, `glg edit` should support taking a query to limit the amount of code returned.

To produce a program, run `glg make`. This will create a `app.js` file that you can run with `node`.

## Language Design

### Records

Records is the only compound type in Gløgg. It looks like this:

```
[ #duck name: "Scrooge" occupation: "Investor?" ]
```

`#duck` is a shorthand for `tag: "duck"`. The above record is the equivalent of:

```
[ tag: "duck" name: "Scrooge" occupation: "Investor?" ]
```

Gløgg supports numbers and strings as values.

### Code blocks

Gløgg has three kinds of queries, or code blocks:

1. Unconditional commits
2. Conditional binds
3. Conidtional commits

Unconditional commits starts with a `commit:` keyword. Any number of records that follow this keyword is commited
to memory for the lifetime of the program.

Conditional binds and commits starts with a `search:` keyword. Any records that follow this keyword defines a
pattern that must successfully bind for the following `commit:` or `bind:` to take effect. You can sort of imagine
record patterns as a funnel. Only the records/values that passes through all the record patterns are passed to the
`commit:` or `bind:` section.

A `bind` is a temporary record. It only exists as long as the `search:` remains valid. A `commit`, on the other
hand, is permanent. Commited records will remain in memory, even if the `search` that produced them becomes invalid.

### Frequencies

Gløgg is meant to implement ideas from the DatalogFS paper. The idea is that you can work based on the number of times
a pattern is matched.

```
search:
  1/[ #person name: "Bruce Lee" ]
commit @stdio:
  [ #log message: "There can be only one" ]
```

The `commit` in the above section will only happen if there exists exactly one person named `Bruce Lee`. The `1/` syntax
adds a frequency requirement to the pattern. In the same way, you can also define `0/` to check that something never
happens (which would otherwise stop the search).

You can also extract the frequency using `n/`, wich would store the frequency in the `n` variable. This would allow you
to check if two patterns happens an equal amount of times.

Gren should also support numerical operations and comparisons, which would open up more possibilities.

Frequencies is currently not implemented in any form.

### Contexts

A Gløgg program can contain multiple in-memory databases, or contexts. By default, the `default` context is used,
but you can target different contexts using `@`. Contexts are created on the fly, so you don't have to define them
up front.

```
search @html:
  [ #document body: body ]
commit @html:
  [ #div parent: body text: "Hello world" ]
```

### Interop

Gløgg programs are _just_ data. To make something happen, you need to attach integrations. The idea here is that
you can attach listeners for when certain events (record added, modified, deleted...) happen in a specific context.

Maybe it could look like this:

```js
const program = require("./app.js"); //compiled with glg make

const listener = program.context("html");

listener.on("new_record", (record) => {
  const el = document.createElement(record.tag);
  el.innerText = record.text;

  document.body.addElement(el);
});
```
