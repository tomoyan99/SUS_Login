function errortest(){
    throw Error("test");
}
function errortest2(){
    try{
        errortest()
    }catch (e) {
        throw new Error("test2",{
            cause:e
        });
    }
}
try{
    errortest2()
}catch (e) {
    console.dir(e)
}