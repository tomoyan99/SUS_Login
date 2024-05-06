async function f() {
    throw "a"
}
try{
    f().catch((r)=>{throw "aiu"});
}catch (e) {
    console.log(e)
}