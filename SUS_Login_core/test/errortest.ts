function main() {
    const a = new Error("error");
    const b = Object.getOwnPropertyDescriptors<Error>(a);
    console.log(b.message.value);
}
main()