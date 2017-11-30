

```handlebars
{{#each collections as |collection|}}
  {{assign "idx" @index}}

  {{#each @collection as |item|}}
    Index: {{@idx}}

    {{@item.data.name}} {{@item.index}}
  {{/each}}
{{/each}}

Scope {
  Expression { {{#each collections as |collection|}} }

  Scope {
    Expression { {{#each @collection as |item|}} }
      Expression { {{@item.data.name}} } Expression { {{@item.index}} }
    Expression { {{/each}} }
  }

  Expression { {{/each}} }
}
```

Loops

```js
// {% let key = keys[i]; %}
//   Key: {{ key }}

{% for (let i = 0; i < keys.length; i++) %}
  foo
{% endfor %}

{
  type: 'liquid',
  nodes: [
    {
      type: 'loop.open'
      nodes: [
        {
          type: 'liquid.open',
          val: '{%'
        },
        {
          type: 'text',
          val: 'for'
        },
        {
          type: 'paren',
          nodes: [
            {
              type: 'paren.open',
              val: '('
            },
            {
              type: 'text',
              val: 'let i = 0; i < keys.length; i++'
            },
            {
              type: 'paren.close',
              val: ')'
            }
          ]
        },
        {
          type: 'liquid.close',
          val: '%}'
        },
      ]
    },
    {
      type: 'loop.statement',
      nodes: [
        {
          type: 'text',
          val: '  foo'
        }
      ]
    },
    {
      type: 'loop.close',
      nodes: [
        {
          type: 'liquid.open',
          val: '{%'
        },
        {
          type: 'text',
          val: 'endfor'
        },
        {
          type: 'liquid.close',
          val: '%}'
        }
      ]
    }
  ]
}

```

Functions

```js
function foo(a, b, c) {
  let one = 'two';

}
```


```handlebars
{{#capture}}
  This is some stuff to capture.
{{/capture}}
```

```handlebars
{{#* inline "iterationCount"}}
  <li>I'm iteration #{{number}}</li>
{{/inline}}

{{#each someArray}}
  {{> iterationCount}}
{{/each}}
```

```

```
