#include <iostream>
#include <syscall.h>
#include <unistd.h>
#include <stdio.h>
#include <sys/types.h>
#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <stdint.h>
#include <string.h>

namespace jskernel {

    using v8::FunctionCallbackInfo;
    using v8::Isolate;
    using v8::Local;
    using v8::Object;
    using v8::String;
    using v8::Value;
    using v8::Handle;
    using v8::Array;
    using v8::Integer;
    using v8::Exception;

    uint64_t GetBufferAddr(Local<Object> obj) {
        return (uint64_t) node::Buffer::Data(obj);
    }

    uint64_t ArgToInt(Local<Value> arg) {
        if(arg->IsNumber()) {
            return (uint64_t) arg->Int32Value();
        } else {
            if(arg->IsString()) {
                String::Utf8Value v8str(arg->ToString());
    //            String::AsciiValue  v8str(arg->ToString());
                std::string cppstr = std::string(*v8str);
                const char *cstr = cppstr.c_str();
                return (uint64_t) cstr;
            } else {
                return GetBufferAddr(arg->ToObject());
            }
        }
    }

    uint64_t ExecSyscall(const FunctionCallbackInfo<Value>& args) {
        char len = (char) args.Length();

        uint64_t cmd = (uint64_t) args[0]->Int32Value();
        if(len == 1) return syscall(cmd);

        uint64_t arg1 = ArgToInt(args[1]);
        if(len == 2) return syscall(cmd, arg1);

        uint64_t arg2 = ArgToInt(args[2]);
        if(len == 3) return syscall(cmd, arg1, arg2);

        uint64_t arg3 = ArgToInt(args[3]);
        if(len == 4) return syscall(cmd, arg1, arg2, arg3);

        uint64_t arg4 = ArgToInt(args[4]);
        if(len == 5) return syscall(cmd, arg1, arg2, arg3, arg4);

        uint64_t arg5 = ArgToInt(args[5]);
        if(len == 6) return syscall(cmd, arg1, arg2, arg3, arg4, arg5);

        uint64_t arg6 = ArgToInt(args[6]);
        if(len == 7) return syscall(cmd, arg1, arg2, arg3, arg4, arg5, arg6);
        return -1;
    }

    void MethodSyscall(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        char len = (char) args.Length();
        if(len > 7) isolate->ThrowException(String::NewFromUtf8(isolate, "Syscall with over 6 arguments."));
        else args.GetReturnValue().Set(Integer::New(isolate, ExecSyscall(args)));
    }

    void MethodSyscall64(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        char len = (char) args.Length();
        if(len > 7) isolate->ThrowException(String::NewFromUtf8(isolate, "Syscall with over 6 arguments."));
        else {
            uint64_t result = ExecSyscall(args);
            uint32_t lo = (uint32_t) (result & 0xffffffff);
            uint32_t hi = (uint32_t) (result >> 32);

            Handle<Array> array = Array::New(isolate, 2);
            array->Set(0, Integer::New(isolate, lo));
            array->Set(1, Integer::New(isolate, hi));

            args.GetReturnValue().Set(array);
        }
    }

    void MethodBufAddr64(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();

        uint64_t addr = GetBufferAddr(args[0]->ToObject());
        uint32_t lo = (uint32_t) (addr & 0xffffffff);
        uint32_t hi = (uint32_t) (addr >> 32);


        Handle<Array> array = Array::New(isolate, 2);
        array->Set(0, Integer::New(isolate, lo));
        array->Set(1, Integer::New(isolate, hi));
        args.GetReturnValue().Set(array);
    }

    void MethodBufAddr32(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        uint64_t addr = GetBufferAddr(args[0]->ToObject());
        args.GetReturnValue().Set(Integer::New(isolate, addr));
    }

    void MethodMalloc(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();

        char* addr = (char*) args[0]->Int32Value();
        size_t size = (size_t) args[1]->Int32Value();

        v8::Local<v8::Object> buf = node::Buffer::New(isolate, addr, size).ToLocalChecked();
        args.GetReturnValue().Set(buf);
    }

//    void MethodGen(const FunctionCallbackInfo<Value>& args) {
//        Isolate* isolate = args.GetIsolate();
//
//        size_t size = 3;
//        char* data = (char*) malloc(size);
//        data[0] = 65;
//        data[1] = 66;
//        data[2] = 67;
//
//
//        args.GetReturnValue().Set(Integer::New(isolate, (uint64_t) data));
//    }

    void init(Local<Object> exports) {
        NODE_SET_METHOD(exports, "syscall",     MethodSyscall);
        NODE_SET_METHOD(exports, "syscall64",   MethodSyscall64);
        NODE_SET_METHOD(exports, "addr",        MethodBufAddr32);
        NODE_SET_METHOD(exports, "addr64",      MethodBufAddr64);
        NODE_SET_METHOD(exports, "malloc",      MethodMalloc);
//        NODE_SET_METHOD(exports, "gen",         MethodGen);
    }

    NODE_MODULE(addon, init)

}
