import stylus from 'stylus';
type Stylus = typeof stylus;
type Nodes = Stylus['nodes'];

export namespace Stylus {
  export type Root = InstanceType<Nodes['Root']>;
  export type Block = InstanceType<Nodes['Block']>;
  export type Group = InstanceType<Nodes['Group']>;
  export type Selector = InstanceType<Nodes['Selector']>;
  export type Ident = InstanceType<Nodes['Ident']>;
  export type Property = InstanceType<Nodes['Property']>;
  export type Expression = InstanceType<Nodes['Expression']>;
  export type Literal = InstanceType<Nodes['Literal']>;
  export type Call = InstanceType<Nodes['Call']>;
  export type Arguments = InstanceType<Nodes['Arguments']>;
  export type Unit = InstanceType<Nodes['Unit']>;
  export type Each = InstanceType<Nodes['Each']>;
  export type Function = InstanceType<Nodes['Function']>;
  export type Params = InstanceType<Nodes['Params']>;
  export type BinOp = InstanceType<Nodes['BinOp']>;
  export type Node = Omit<InstanceType<Nodes['Node']>, 'nodeName'> &
    (
      | ({ nodeName: 'root' } & Root)
      | ({ nodeName: 'block' } & Block)
      | ({ nodeName: 'group' } & Group)
      | ({ nodeName: 'selector' } & Selector)
      | ({ nodeName: 'ident' } & Ident)
      | ({ nodeName: 'property' } & Property)
      | ({ nodeName: 'expression' } & Expression)
      | ({ nodeName: 'literal' } & Literal)
      | ({ nodeName: 'call' } & Call)
      | ({ nodeName: 'arguments' } & Arguments)
      | ({ nodeName: 'unit' } & Unit)
      | ({ nodeName: 'each' } & Each)
      | ({ nodeName: 'function' } & Function)
      | ({ nodeName: 'params' } & Params)
      | ({ nodeName: 'binop' } & BinOp)
    );
}
