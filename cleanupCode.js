//the below code should be dropped into the browser and run when you want to delete books, it will bring up the dialog box to delete the next book.
//If you hit space and backspace and click delete, then that deletes the book. 
//With a little practice this can be done very quickly. 

function deleteNextBook(){

    $(`[ng-if="::vm.showButtons.manage"]`)[0].children[0].click();
    
    setTimeout(()=>{
        $(`[ng-click="bookService.delete(book)"]`)[0].click()
        c = $(`[ng-model="confirmText"]`)[0];
    },500);
    
    setTimeout(()=>{
        c.value = $("strong.ng-binding")[0].innerText
    },600)
    
    setTimeout(()=>{
        c.click();
        c.focus()
    },600)
    
    setTimeout(()=>{
    $(`[ng-click="deleteBook()"]`)[0].click();
    },800);
    
}