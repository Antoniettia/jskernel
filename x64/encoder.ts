import * as o from './operand';
import {Definition} from './def';
import * as i from './instruction';


export enum MODE {
    REAL = 0,
    COMPAT,
    LONG,
}

export class Encoder {

    createInstruction(def: Definition, op: i.Operands) {
        var ins = new i.Instruction(def, op);

        var dstreg: o.Register = null;
        var dstmem: o.Memory = null;
        var srcreg: o.Register = null;
        var srcmem: o.Memory = null;

        // Destination
        if(op.dst instanceof o.Register)    dstreg = op.dst as o.Register;
        else if(op.dst instanceof o.Memory) dstmem = op.dst as o.Memory;
        else throw TypeError(`Destination operand should be Register or Memory; given: ${ins.op.dst.toString()}`);

        // Source
        if(op.src) {
            if (op.src instanceof o.Register)       srcreg = op.src as o.Register;
            else if (op.src instanceof o.Memory)    srcmem = op.src as o.Memory;
            else if (!(op.src instanceof o.Constant))
                throw TypeError(`Source operand should be Register, Memory or Constant`);
        }


        // Prefixes
        // REX prefix
        if(def.mandatoryRex || dstreg.isExtended) {
            var W = 0, R = 0, X = 0, B = 0;
            if(def.mandatoryRex) W = 1;

            if(dstreg && dstreg.isExtended) R = 1;
            if(srcreg && srcreg.isExtended) B = 1;

            if(dstmem) {
                if(dstmem.base && dstmem.base.isExtended) B = 1;
                if(dstmem.index && dstmem.index.isExtended) X = 1;
            }
            if(srcmem) {
                if(srcmem.base && srcmem.base.isExtended) B = 1;
                if(srcmem.index && srcmem.index.isExtended) X = 1;
            }

            ins.parts.push(new i.PrefixRex(W, R, X, B));
        }


        // Op-code
        var opcode = new i.Opcode;
        opcode.op = def.op;

        if(def.regInOp) {
            // We have register encoded in op-code here.
            if(!dstreg) throw TypeError(`Operation needs destination register.`);
            opcode.op = (opcode.op & i.Opcode.MASK_OP) | dstreg.id;
        } else {
            // Direction bit `d`
            opcode.op = (opcode.op & i.Opcode.MASK_DIRECTION) |
                (dstreg ? i.Opcode.DIRECTION.REG_IS_DST : i.Opcode.DIRECTION.REG_IS_SRC);

            // Size bit `s`
            opcode.op = (opcode.op & i.Opcode.MASK_SIZE) | (i.Opcode.SIZE.WORD);
        }

        opcode.regIsDest = def.regIsDest;
        opcode.isSizeWord = def.isSizeWord;
        opcode.regInOp = def.regInOp;
        ins.parts.push(opcode);


        // Mod-RM
        if(srcreg) {
            var mod = 0, reg = 0, rm = 0;
            if(srcreg && dstreg) {
                mod = i.Modrm.MOD.REG_TO_REG;
                reg = dstreg.id;
                rm = srcreg.id;
            } else {
                var mem: o.Memory = srcmem || dstmem;
                if(mem) {
                    if(mem.disp) {

                    } else {
                        mod = i.Modrm.MOD.INDIRECT;

                    }
                }
            }
            ins.parts.push(new i.Modrm(mod, reg, rm));
        }


        // SIB


        // Immediate

        return ins;
    }
}


export class RandomizingEncoder extends Encoder {

}
